using System;
using OpenCvSharp;
using NAudio.Wave;
using System.Text;
using System.Net.Http;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.IO;
using System.Diagnostics;


namespace desktop
{

    public partial class MainWindow : System.Windows.Window
    {
        private CameraDevice _camera;
        private AudioDevice _audio;
        private IDeviceService _deviceService;
        private VideoStreamClient _videoClient;
        private AudioStreamClient _audioClient;
        private bool _connected = false;

        public MainWindow()
        {
            InitializeComponent();
            _camera = new CameraDevice(0);
            _audio = new AudioDevice();

            // resolve Python device service from DI
            _deviceService = App.CurrentApp.ServiceProvider.GetService(typeof(IDeviceService)) as IDeviceService;

            CompositionTarget.Rendering += UpdateFrame;

            // populate devices (fire-and-forget)
            _ = LoadDevicesAsync();
        }

        private async System.Threading.Tasks.Task LoadDevicesAsync()
        {
            try
            {
                // Enumerate local devices in C# and populate UI. User selection will be sent to Python on connect.
                var cams = EnumerateLocalCameras(6);
                var auds = EnumerateLocalAudioDevices();
                Dispatcher.Invoke(() =>
                {
                    deviceCombo.Items.Clear();
                    audioCombo.Items.Clear();
                    foreach (var c in cams)
                    {
                        deviceCombo.Items.Add(new System.Windows.Controls.ComboBoxItem { Content = c.Name, Tag = c.Id });
                    }
                    foreach (var a in auds)
                    {
                        audioCombo.Items.Add(new System.Windows.Controls.ComboBoxItem { Content = a.Name, Tag = a.Id });
                    }
                    if (deviceCombo.Items.Count > 0) deviceCombo.SelectedIndex = 0;
                    if (audioCombo.Items.Count > 0) audioCombo.SelectedIndex = 0;
                });
            }
            catch { }
        }

        private System.Collections.Generic.List<(string Id, string Name)> EnumerateLocalCameras(int maxIndex)
        {
            var list = new System.Collections.Generic.List<(string, string)>();
            for (int i = 0; i < maxIndex; i++)
            {
                try
                {
                    using var cap = new VideoCapture(i);
                    if (!cap.IsOpened())
                    {
                        cap.Release();
                        continue;
                    }
                    using var mat = new Mat();
                    if (cap.Read(mat) && !mat.Empty())
                    {
                        list.Add((i.ToString(), $"Camera {i}"));
                    }
                    cap.Release();
                }
                catch { }
            }
            return list;
        }

        private System.Collections.Generic.List<(string Id, string Name)> EnumerateLocalAudioDevices()
        {
            var list = new System.Collections.Generic.List<(string, string)>();
            try
            {
                int count = WaveIn.DeviceCount;
                for (int i = 0; i < count; i++)
                {
                    try
                    {
                        var caps = WaveIn.GetCapabilities(i);
                        var name = string.IsNullOrEmpty(caps.ProductName) ? $"Microphone {i}" : caps.ProductName;
                        list.Add(($"audio_{i}", $"Microphone {i}: {name}"));
                    }
                    catch { }
                }
            }
            catch
            {
                // fallback: add default
                list.Add(("audio_0", "Microphone 0"));
            }
            return list;
        }

        private void UpdateFrame(object sender, EventArgs e)
        {
            var source = _camera.GetFrameSource();
            if (source != null)
            {
                imageDisplay.Source = source;
                volumeBar.Value = _audio.CurrentVolume;
            }
        }

        private async void ConnectButton_Click(object sender, RoutedEventArgs e)
        {
            if (!_connected)
            {
                var item = deviceCombo.SelectedItem as System.Windows.Controls.ComboBoxItem;
                if (item == null) return;
                var deviceId = item.Tag as string;
                try
                {
                    if (_deviceService != null)
                        await _deviceService.StartCaptureAsync(deviceId, "video");

                    _videoClient = new VideoStreamClient();
                    _videoClient.OnFrame += (s, ev) =>
                    {
                        Dispatcher.Invoke(() =>
                        {
                            imageDisplay.Source = ev.Image;
                            try { faceScoreText.Text = $"Face: {ev.FaceScore:F1}"; } catch { }
                        });
                    };
                    await _videoClient.ConnectAsync(new Uri("ws://127.0.0.1:8000/ws/video"));
                    connectButton.Content = "Disconnect";
                    _connected = true;
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Failed to connect: " + ex.Message);
                }
            }
            else
            {
                try
                {
                    var item = deviceCombo.SelectedItem as System.Windows.Controls.ComboBoxItem;
                    var deviceId = item?.Tag as string;
                    if (_deviceService != null && deviceId != null)
                        await _deviceService.StopCaptureAsync(deviceId);
                    if (_videoClient != null) await _videoClient.DisconnectAsync();
                    if (_audioClient != null) await _audioClient.DisconnectAsync();
                }
                catch { }
                connectButton.Content = "Connect";
                _connected = false;
            }
        }

        private bool _audioConnected = false;
        private async void AudioConnectButton_Click(object sender, RoutedEventArgs e)
        {
            if (!_audioConnected)
            {
                var item = audioCombo.SelectedItem as System.Windows.Controls.ComboBoxItem;
                if (item == null) return;
                var deviceId = item.Tag as string;
                try
                {
                    if (_deviceService != null)
                        await _deviceService.StartCaptureAsync(deviceId, "audio");

                    _audioClient = new AudioStreamClient();
                    _audioClient.OnAudioData += (s, ev) =>
                    {
                        Dispatcher.Invoke(() =>
                        {
                            audioScoreText.Text = $"Voice: {ev.Score:F1}";
                            volumeBar.Value = Math.Min(1.0, ev.Score / 100.0);
                        });
                    };
                    await _audioClient.ConnectAsync(new Uri("ws://127.0.0.1:8000/ws/audio"));
                    audioConnectButton.Content = "Disconnect Audio";
                    _audioConnected = true;
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Failed to connect audio: " + ex.Message);
                }
            }
            else
            {
                try
                {
                    var item = audioCombo.SelectedItem as System.Windows.Controls.ComboBoxItem;
                    var deviceId = item?.Tag as string;
                    if (_deviceService != null && deviceId != null)
                        await _deviceService.StopCaptureAsync(deviceId);
                    if (_audioClient != null) await _audioClient.DisconnectAsync();
                }
                catch { }
                audioConnectButton.Content = "Connect Audio";
                _audioConnected = false;
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            CompositionTarget.Rendering -= UpdateFrame;
            _camera?.Dispose();
            _audio?.Dispose();
            base.OnClosed(e);
        }
    }

}
