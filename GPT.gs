function chatGPT(totalMessages, lineUserId) {
  let return_text; // 返答用の変数を定義

  // totalMessages が undefined または配列でない場合、空の配列を作成
  if (!totalMessages || !Array.isArray(totalMessages)) {
    totalMessages = [];
  }

  const constraints = SHEET.getRange(1, 1).getValue(); // 制約
  totalMessages.unshift({"role": "system", "content": constraints}); // 制約を先頭に追加

  const requestOptions = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "api-key": AZURE_API_KEY  // Azure OpenAIでは api-key ヘッダーを使用
    },
    "payload": JSON.stringify({
      "messages": totalMessages, // メッセージを送信
      "max_tokens": 1000 // 必要に応じてトークン数を設定
    }),
    "muteHttpExceptions": true // エラーを取得するために追加
  };

  try {
    const response = UrlFetchApp.fetch(AZURE_ENDPOINT, requestOptions);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log("Azure APIエラー: " + responseText);
      return_text = "エラーが発生しました。";
    } else {
      const json = JSON.parse(responseText);
      return_text = json['choices'][0]['message']['content'].trim();
    }

  } catch (error) {
    return_text = "ごめん、ちょっと何か不具合が起きたみたい。もう一回送ってくれない？";
    Logger.log("Azure APIエラー: " + error);
  }

  Logger.log(return_text); // デバッグ用
  return return_text;
}
