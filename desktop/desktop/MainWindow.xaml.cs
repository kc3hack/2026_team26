using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using FatigueSystem; // FatigueData.csがあることを確認してください

namespace desktop
{
    /// <summary>
    /// MainWindow.xaml の相互作用ロジック
    /// </summary>
    public partial class MainWindow : Window
    {
        private CameraDevice _camera;

        private UdpClient _udp;
        private double _latestScore = 100.0;
        private DispatcherTimer _displayTimer;

        public MainWindow()
        {
            InitializeComponent();

            _camera = new CameraDevice(0);
            CompositionTarget.Rendering += UpdateFrame;

            // 1. Pythonからのデータ受信を開始
            Task.Run(() => ReceiveLoop());

            // 2. 3秒おきに数値を更新するタイマー
            _displayTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3) };
            _displayTimer.Tick += (s, e) => {
                if (txtScore != null)
                {
                    txtScore.Text = Math.Round(_latestScore).ToString();
                    // スコアに応じて色を変える
                    txtScore.Foreground = _latestScore <= 30 ? Brushes.Red : (_latestScore <= 60 ? Brushes.Orange : Brushes.White);
                }
            };
            _displayTimer.Start();
        }

        private async void ReceiveLoop()
        {
            try
            {
                _udp = new UdpClient(5005);
                _udp.Client.ReceiveBufferSize = 1024 * 1024;
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                while (true)
                {
                    var result = await _udp.ReceiveAsync();
                    var json = Encoding.UTF8.GetString(result.Buffer);
                    var data = JsonSerializer.Deserialize<FatigueData>(json, options);

                    if (data != null)
                    {
                        _latestScore = data.Score;
                        // 映像と警告はリアルタイムで更新
                        Dispatcher.Invoke(() => {
                            UpdateImage(data.ImageData);
                            if (warningOverlay != null)
                            {
                                warningOverlay.Visibility = _latestScore <= 30 ? Visibility.Visible : Visibility.Hidden;
                            }
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Receive Error: " + ex.Message);
            }
        }

        private void UpdateImage(string base64)
        {
            try
            {
                if (string.IsNullOrEmpty(base64)) return;
                var bi = new BitmapImage();
                bi.BeginInit();
                bi.StreamSource = new MemoryStream(Convert.FromBase64String(base64));
                bi.CacheOption = BitmapCacheOption.OnLoad;
                bi.EndInit();
                bi.Freeze();
                if (videoDisplay != null)
                {
                    videoDisplay.Source = bi;
                }
            }
            catch { /* デコード失敗は無視 */ }
        }

        protected override void OnClosed(EventArgs e)
        {
            CompositionTarget.Rendering -= UpdateFrame;
            _camera?.Dispose();


            _udp?.Close();
            base.OnClosed(e);
        }

        private void UpdateFrame(object sender, EventArgs e)
        {
            var source = _camera.GetFrameSource();
            if (source != null)
            {
                // XAMLに書いた <Image x:Name="imageDisplay" /> に表示
                imageDisplay.Source = source;
                // カメラ更新（既存コード）
                imageDisplay.Source = _camera.GetFrameSource();
            }
        }
    }
}