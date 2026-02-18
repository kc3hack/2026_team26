using System;
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

    public partial class MainWindow : Window
    {
        private CameraDevice _camera;
        private AudioDevice _audio;

        public MainWindow()
        {
            InitializeComponent();
            _camera = new CameraDevice(0);
            _audio = new AudioDevice();

            CompositionTarget.Rendering += UpdateFrame;
        }

        private void UpdateFrame(object sender, EventArgs e)
        {
            var source = _camera.GetFrameSource();
            if (source != null)
            {
                // XAMLに書いた <Image x:Name="imageDisplay" /> に表示
                // カメラ更新（既存コード）
                imageDisplay.Source = _camera.GetFrameSource();

                // マイクの音量をバーに反映
                volumeBar.Value = _audio.CurrentVolume;
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