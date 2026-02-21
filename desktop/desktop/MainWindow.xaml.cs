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
        // UI control references (resolved at runtime via FindName to avoid depending on generated .g.cs)
        private System.Windows.Controls.Image imageDisplayRef;
        private System.Windows.Controls.ProgressBar volumeBarRef;
        private System.Windows.Controls.TextBlock faceScoreTextRef;
        private System.Windows.Controls.TextBlock audioScoreTextRef;
        private System.Windows.Controls.Button connectButtonRef;
        private System.Windows.Controls.Button audioConnectButtonRef;
        private System.Windows.Controls.ComboBox deviceComboRef;
        private System.Windows.Controls.ComboBox audioComboRef;

        // Fallback InitializeComponent implementation that loads the XAML at runtime
        // This ensures XAML is loaded even if the designer-generated InitializeComponent is not present.
        private void InitializeComponent()
        {
            try
            {
                var resourceLocater = new Uri("/desktop;component/MainWindow.xaml", UriKind.Relative);
                System.Windows.Application.LoadComponent(this, resourceLocater);
            }
            catch
            {
                // swallow: if LoadComponent fails, the app will continue and FindName lookups will return null
            }
        }
        private CameraDevice _camera;
        private AudioDevice _audio;
        private IDeviceService _deviceService;
        private VideoStreamClient _videoClient;
        private AudioStreamClient _audioClient;
        private bool _connected = false;

        public MainWindow()
        {
            // Ensure XAML is loaded even if designer-generated InitializeComponent isn't available.
            InitializeComponent();
            // Resolve named controls from XAML safely
            deviceComboRef = this.FindName("deviceCombo") as System.Windows.Controls.ComboBox;
            audioComboRef = this.FindName("audioCombo") as System.Windows.Controls.ComboBox;
            imageDisplayRef = this.FindName("imageDisplay") as System.Windows.Controls.Image;
            volumeBarRef = this.FindName("volumeBar") as System.Windows.Controls.ProgressBar;
            faceScoreTextRef = this.FindName("faceScoreText") as System.Windows.Controls.TextBlock;
            audioScoreTextRef = this.FindName("audioScoreText") as System.Windows.Controls.TextBlock;
            connectButtonRef = this.FindName("connectButton") as System.Windows.Controls.Button;
            audioConnectButtonRef = this.FindName("audioConnectButton") as System.Windows.Controls.Button;
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
                    var devCombo = this.FindName("deviceCombo") as System.Windows.Controls.ComboBox;
                    var audCombo = this.FindName("audioCombo") as System.Windows.Controls.ComboBox;
                    if (devCombo != null) devCombo.Items.Clear();
                    if (audCombo != null) audCombo.Items.Clear();
                    foreach (var c in cams)
                    {
                        devCombo?.Items.Add(new System.Windows.Controls.ComboBoxItem { Content = c.Name, Tag = c.Id });
                    }
                    foreach (var a in auds)
                    {
                        audCombo?.Items.Add(new System.Windows.Controls.ComboBoxItem { Content = a.Name, Tag = a.Id });
                    }
                    if (devCombo != null && devCombo.Items.Count > 0) devCombo.SelectedIndex = 0;
                    if (audCombo != null && audCombo.Items.Count > 0) audCombo.SelectedIndex = 0;
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
                if (imageDisplayRef != null) imageDisplayRef.Source = source;
                if (volumeBarRef != null) volumeBarRef.Value = _audio.CurrentVolume;
            }
        }

        private async void ConnectButton_Click(object sender, RoutedEventArgs e)
        {
            if (!_connected)
            {
                var devCombo = deviceComboRef ?? this.FindName("deviceCombo") as System.Windows.Controls.ComboBox;
                var item = devCombo?.SelectedItem as System.Windows.Controls.ComboBoxItem;
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
                            if (imageDisplayRef != null) imageDisplayRef.Source = ev.Image;
                            try { if (faceScoreTextRef != null) faceScoreTextRef.Text = $"Face: {ev.FaceScore:F1}"; } catch { }
                        });
                    };
                    await _videoClient.ConnectAsync(new Uri("ws://127.0.0.1:8000/ws/video"));
                    if (connectButtonRef != null) connectButtonRef.Content = "Disconnect";
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
                    var devCombo = deviceComboRef ?? this.FindName("deviceCombo") as System.Windows.Controls.ComboBox;
                    var item = devCombo?.SelectedItem as System.Windows.Controls.ComboBoxItem;
                    var deviceId = item?.Tag as string;
                    if (_deviceService != null && deviceId != null)
                        await _deviceService.StopCaptureAsync(deviceId);
                    if (_videoClient != null) await _videoClient.DisconnectAsync();
                    if (_audioClient != null) await _audioClient.DisconnectAsync();
                }
                catch { }
                if (connectButtonRef != null) connectButtonRef.Content = "Connect";
                _connected = false;
            }
        }

        private bool _audioConnected = false;
        private async void AudioConnectButton_Click(object sender, RoutedEventArgs e)
        {
            if (!_audioConnected)
            {
                var audCombo = audioComboRef ?? this.FindName("audioCombo") as System.Windows.Controls.ComboBox;
                var item = audCombo?.SelectedItem as System.Windows.Controls.ComboBoxItem;
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
                            if (audioScoreTextRef != null) audioScoreTextRef.Text = $"Voice: {ev.Score:F1}";
                            if (volumeBarRef != null) volumeBarRef.Value = Math.Min(1.0, ev.Score / 100.0);
                        });
                    };
                    await _audioClient.ConnectAsync(new Uri("ws://127.0.0.1:8000/ws/audio"));
                    if (audioConnectButtonRef != null) audioConnectButtonRef.Content = "Disconnect Audio";
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
                    var audCombo = audioComboRef ?? this.FindName("audioCombo") as System.Windows.Controls.ComboBox;
                    var item = audCombo?.SelectedItem as System.Windows.Controls.ComboBoxItem;
                    var deviceId = item?.Tag as string;
                    if (_deviceService != null && deviceId != null)
                        await _deviceService.StopCaptureAsync(deviceId);
                    if (_audioClient != null) await _audioClient.DisconnectAsync();
                }
                catch { }
                if (audioConnectButtonRef != null) audioConnectButtonRef.Content = "Connect Audio";
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
