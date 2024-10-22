// LINEからのメッセージ受信 (ここからスタート)
function doPost(e) {
  try {
    // リクエストデータ全体をログに記録する
    Logger.log("リクエストデータ全体: " + JSON.stringify(e));

    // e または e.postData が未定義の場合にログを出力
    if (!e || !e.postData) {
      Logger.log("リクエストデータがありません。e: " + JSON.stringify(e));
      return;
    }

    // POSTデータの取得
    const data = JSON.parse(e.postData.contents).events[0]; // 情報取得
    if (!data) {
      Logger.log("メッセージデータがありません。");
      return SS.getSheetByName('検証用').appendRow(["検証OK"]);
    }

    const replyToken = data.replyToken; // リプレイトークン
    const lineUserId = data.source.userId; // LINE ユーザーID 追加
    const dataType = data.type; // データのタイプ
    
    Logger.log(`メッセージ受信: ${JSON.stringify(data)}`);
    
    // Azure APIキーがなかった場合、シンプルにおうむ返し
    if (!AZURE_API_KEY) {
      Logger.log("Azure APIキーが設定されていません。");
      if (dataType == "follow") {
        return debugLog(lineUserId, "初めまして", "初めまして！");
      }

      if (data.message && data.message.text === "サブスク") {
        return subscriptionMessage(replyToken, lineUserId);
      } else if (data.message && data.message.text === "シャンパン") {
        return champanuMessage(replyToken, lineUserId);
      }

      const parrotMessage = data.message ? data.message.text : "何かメッセージを送ってください。";
      sendMessage(replyToken, parrotMessage);
      debugLog(lineUserId, parrotMessage, parrotMessage);
      return;
    }

    // フォロー時に新しく個別のシートを作成
    if (dataType == "follow") {
      return debugLog(lineUserId, "初めまして", "初めまして！私はAIカウンセラーのまほろだよ！　あなたのことはなんて呼べばよいかな？");
    } else if (data.message && data.message.type == "sticker") {
      return sendSticker(replyToken);
    }

    // テキスト以外だった時（スタンプや写真など）
    const postMessage = data.message ? data.message.text : undefined;
    if (!postMessage) {
      return sendMessage(replyToken, "まだ文章しかわからないんだ💦ごめんね😢");
    }

    // データ生成＆LINEに送信
    const userAllData = findUserAllData(lineUserId);
    if (userAllData[7] >= MAX_COUNT_DAILY_MES && (userAllData[8] == "inactive" || !userAllData[8])) {
      return subscriptionMessage(replyToken, lineUserId);
    }

    const totalMessages = chatGPTLog(lineUserId, postMessage);
    const replyText = callAzureApi(totalMessages); // Azure APIでの応答取得
    sendMessage(replyToken, replyText); // LINEへ応答

    // ログに追加
    debugLog(lineUserId, postMessage, replyText);
  } catch (error) {
    Logger.log("エラーが発生しました: " + error);
  }
}
