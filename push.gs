const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"; // LINEユーザー個別に送る
const LINE_BROADCAST_URL = "https://api.line.me/v2/bot/message/broadcast"; // LINEユーザー全体に送る

function sendBroadcastMessage(message) {
  const postData = {
    "messages" : [
      {
        "type" : "text",
        "text" : message
      }
    ]
  };  
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    "Authorization" : `Bearer ${LINE_ACCESS_TOKEN}`
  };
  const options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(LINE_BROADCAST_URL, options);
}

function sendPushMessage(to, pushText) {
  const postData = {
    "to" : to,
    "messages" : [
      {
        "type" : "text",
        "text" : pushText
      }
    ]
  };  
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    "Authorization" : `Bearer ${LINE_ACCESS_TOKEN}`
  };
  const options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(LINE_PUSH_URL, options);
}

function testFunction() {
  const to = "************************"
  const pushText = `単品決済も、テストで作ってみました！プログラムも、note上にあります。更新してます。\nhttps://buy.stripe.com/************************?client_reference_id=${to}`
  sendPushMessage(to, pushText)
  // 
}

// 登録しているユーザー全員に送信
function userTestFunction() {
  const data = SHEET_USER.getDataRange().getValues();
  let to;
  for (i in data) {
    if (i == 0)
     continue;
    to = data[i][0];
    console.log(to)
    const pushText = `単品決済も、テストで作ってみました！プログラムも、note上にあります。更新してます。\nhttps://buy.stripe.com/************************?client_reference_id=${to}`
    sendPushMessage(to, pushText)
  }
}
