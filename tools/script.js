document.addEventListener('DOMContentLoaded', () => {
  onDomLoaded();
});
let authToken = null; // 認証トークンを格納する変数
let uid = null;
function onDomLoaded() {
  const uidInput = document.getElementById('uid');
  uidInput.addEventListener('input', () => {
    uid = uidInput.value; // 入力されたユーザーIDを変数に格納
    console.log('ユーザーIDが更新されました:', uid);
    // ここにユーザーIDが更新されたときの処理を追加
  });
  const authTokenInput = document.getElementById('auth-token');
  authTokenInput.addEventListener('input', () => {
    authToken = authTokenInput.value; // 入力された認証トークンを変数に格納
    console.log('認証トークンが更新されました:', authToken);
    // ここに認証トークンが更新されたときの処理を追加
  });
  const checkbox = document.getElementById('start-button');
  checkbox.checked = false; // 初期状態はオフにする
  checkbox.disabled = false; // 初期状態はオフにする
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      checkButtonTrue();
      console.log('スタートボタンがオンになりました。');
      // ここにスタートボタンがオンになったときの処理を追加
    } else {
      checkButtonFalse();
      console.log('スタートボタンがオフになりました。');
      // ここにスタートボタンがオフになったときの処理を追加
    }
  });
}

let intervalId;
function checkButtonTrue() {
  intervalId = setInterval(intervalAction, 1000);
  // スタートボタンがオンのときの処理をここに記述
}

function checkButtonFalse() {
  clearInterval(intervalId);
  // スタートボタンがオフのときの処理をここに記述
}

function intervalAction() {
  console.log("定期的に実行される処理");
  const url = 'https://test.sheeplab.net/api/fatigue';
  const randomFaceScore = Math.floor(Math.random() * 125); // 0から124のランダムな整数を生成
  const randomVoiceScore = Math.floor(Math.random() * 125); // 0から124のランダムな整数を生成
  const data = {
    user_id: uid,// ユーザーIDをここに記述
    face_score: randomFaceScore, // 顔のスコアをランダムに生成
    voice_score: randomVoiceScore, // 声のスコアをランダムに生成
    recorded_at: new Date().toISOString() // 記録日時をISO形式で送信
  };
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}` // 認証トークンをヘッダーに追加
    },
    body: JSON.stringify(data) // 送信するデータをここに記述
  })
    .then(response => response.json())
    .then(data => {
      console.log('サーバーからのレスポンス:', data);
      // サーバーからのレスポンスを処理するコードをここに追加
    })
    .catch(error => {
      console.error('エラー:', error);
    });
  // 定期的に実行したい処理をここに記述
}
