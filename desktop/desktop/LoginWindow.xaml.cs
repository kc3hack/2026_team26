using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace desktop
{
    /// <summary>
    /// LoginWindow.xaml の相互作用ロジック
    /// </summary>
    public partial class LoginWindow : Window
    {

        private readonly HttpClient _httpClient = new HttpClient();
        public string AuthToken { get; private set; }// MainWindowに渡す用
        public string UserId { get; private set; } 
        public LoginWindow()
        {
            InitializeComponent();
        }
        // サインインボタン
        private async void SignIn_Click(object sender, RoutedEventArgs e)
        {
            // 入力値からリクエストオブジェクトを作成
            var req = new SigninReq(Email: txtSignInEmail.Text, Password: txtSignInPass.Password);

            try
            {
                // 1. サーバーへPOST送信
                var response = await _httpClient.PostAsJsonAsync("https://test.sheeplab.net/api/auth/signin", req);

                if (response.IsSuccessStatusCode)
                {
                    // 2. レスポンス（AuthRes）を解析
                    var authRes = await response.Content.ReadFromJsonAsync<AuthRes>();

                    if (authRes != null)
                    {
                        // 3. トークンとIDを保存して画面を閉じる
                        this.AuthToken = authRes.AccessToken;
                        this.UserId = authRes.User.Id;

                        MessageBox.Show($"{authRes.User.DisplayName} さん、ログインしました。");
                        this.DialogResult = true; // これでMainWindowが開く（App.xaml.csの制御）
                    }
                }
                else
                {
                    MessageBox.Show("ログインに失敗しました。メールアドレスかパスワードを確認してください。");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"サーバー接続エラー: {ex.Message}");
            }
        }

        // サインアップボタン
        private async void SignUp_Click(object sender, RoutedEventArgs e)
        {
            var req = new SignupReq(
                DisplayName: txtSignUpName.Text, // 名前入力欄の名前（x:Name）に合わせてください
                Email: txtSignUpEmail.Text,
                Password: txtSignUpPass.Password
                
            );

            try
            {
                var response = await _httpClient.PostAsJsonAsync("https://test.sheeplab.net/api/auth/signup", req);

                if (response.IsSuccessStatusCode)
                {
                    MessageBox.Show("登録が完了しました。ログインしてください。");
                    // タブを切り替えるなどの処理
                }
                else
                {
                    MessageBox.Show("登録に失敗しました。入力内容を確認してください。");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"サーバー接続エラー: {ex.Message}");
            }
        }

        private async System.Threading.Tasks.Task<bool> PostAuthAsync(string url, object payload)
        {
            try
            {
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    var resString = await response.Content.ReadAsStringAsync();
                    var resData = JsonDocument.Parse(resString);
                    // サーバーから返ってくるトークンを保存
                    if (resData.RootElement.TryGetProperty("token", out var t))
                    {
                        AuthToken = t.GetString();
                    }
                    return true;
                }
                MessageBox.Show("エラー: " + response.StatusCode);
                return false;
            }
            catch (System.Exception ex)
            {
                MessageBox.Show("接続失敗: " + ex.Message);
                return false;
            }
        }
    }
}

