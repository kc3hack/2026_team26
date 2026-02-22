using System;
using System.Net.Http;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;

namespace desktop
{
    public partial class App : Application
    {
        // 他のクラスから App.Current.ServiceProvider でアクセスできるようにする
        public IServiceProvider ServiceProvider { get; private set; }

        public App()
        {
            var services = new ServiceCollection();
            ConfigureServices(services);

            // BuildServiceProvider はコンストラクタで一回だけ行う
            ServiceProvider = services.BuildServiceProvider();
        }

        private void ConfigureServices(IServiceCollection services)
        {
            // 1. 低レイヤー（ストレージ・通信）
            services.AddSingleton<ISettingsService, SettingsService>();
            services.AddSingleton<ITokenStorage, TokenStorage>();

            // HttpClient の登録（IAuthService は Http フォルダ内を指す）
            services.AddHttpClient<IAuthService, AuthService>(c =>
            {
                c.BaseAddress = new Uri("http://localhost:8080");
            });

            // In-app device service for native capture (replaces Python local service)
            services.AddSingleton<IDeviceService, InAppDeviceService>();

            // 2. Service層
            services.AddTransient<ITeamService, TeamService>();
            services.AddHttpClient<IFatigueService, FatigueService>(c =>
            {
                c.BaseAddress = new Uri("http://localhost:8080");
            });
            services.AddTransient<IUpdateService, UpdateService>();

            // 3. Usecase層
            services.AddTransient<AuthUsecase>();
            services.AddTransient<TeamUsecase>();
            services.AddTransient<FatigueUsecase>();
            services.AddTransient<UpdateUsecase>();

            // 注意: ここにあった var serviceProvider = ... は削除しました
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // アプリが勝手に終了しないように設定
            this.ShutdownMode = ShutdownMode.OnExplicitShutdown;

            LoginWindow loginWin = new LoginWindow();
            if (loginWin.ShowDialog() == true)
            {
                MainWindow mainWin = new MainWindow();
                mainWin.AccessToken = loginWin.AuthToken;
                mainWin.CurrentUserId = loginWin.UserId;

                // メイン画面を表示
                mainWin.Show();

                // メイン画面が表示されたら、終了モードを「主ウィンドウが閉じたら終了」に戻す
                this.MainWindow = mainWin;
                this.ShutdownMode = ShutdownMode.OnMainWindowClose;
            }
            else
            {
                Shutdown();
            }
        }

        // ViewModelなどで簡単に ServiceProvider を取得するためのヘルパー
        public static App CurrentApp => (App)Application.Current;
    }
}
