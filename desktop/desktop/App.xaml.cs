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

            // Python service for device capture (local FastAPI)
            services.AddHttpClient<IDeviceService, PythonDeviceService>(c =>
            {
                c.BaseAddress = new Uri("http://127.0.0.1:8000");
            });

            // 2. Service層
            services.AddTransient<ITeamService, TeamService>();
            services.AddTransient<IFatigueService, FatigueService>();
            services.AddTransient<IUpdateService, UpdateService>();

            // 3. Usecase層
            services.AddTransient<AuthUsecase>();
            services.AddTransient<TeamUsecase>();
            services.AddTransient<FatigueUsecase>();
            services.AddTransient<UpdateUsecase>();

            // 注意: ここにあった var serviceProvider = ... は削除しました
        }

        // ViewModelなどで簡単に ServiceProvider を取得するためのヘルパー
        public static App CurrentApp => (App)Application.Current;
    }
}
