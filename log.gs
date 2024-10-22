// 大元のシートの「ログ」に追加
function debugLog(userId, text, replyText) {
  let UserData = findUser(userId); // ユーザーシートにデータがあるか確認
  // ユーザーシートにデータがなければユーザー追加、あれば投稿数だけ追加
  typeof UserData === "undefined" ? UserData = addUser(userId) : userUseChat(userId);
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_LOG.appendRow([userId, UserData, text, replyText, date]); // ログシートに情報追加
  dataSort(SHEET_LOG, 5); // E列の日付順に並び替え
}

function addUser(userId) {
  const userName = getUserDisplayName(userId);
  const userIMG  = getUserDisplayIMG(userId);
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_USER.appendRow([userId, userName, userIMG, 0, date, date, "", 0]);
  return userName;
}

// ユーザーのプロフィール名取得
function getUserDisplayName(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' : `Bearer ${LINE_ACCESS_TOKEN}`,
    },
  });
  return JSON.parse(userProfile).displayName;
}

// ユーザーのプロフィール画像取得 
function getUserDisplayIMG(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' : `Bearer ${LINE_ACCESS_TOKEN}`,
    },
  });
  return JSON.parse(userProfile).pictureUrl;
}

// スプレッドシートを並び替え(対象のシートのカラムを降順に変更)
function dataSort(sortSheet,columnNumber) {
  const numColumn = sortSheet.getLastColumn(); // 最後列の列番号を取得
  const numRow    = sortSheet.getLastRow()-1;  // 最後行の行番号を取得
  const dataRange = sortSheet.getRange(2, 1, numRow, numColumn);
  dataRange.sort([{column: columnNumber, ascending: false}]); // 降順に並び替え
}

// ユーザーのシートを更新 
function userUseChat(userId) {
  // 送信したユーザー先のユーザーを検索
  const textFinder = SHEET_USER.createTextFinder(userId);
  const ranges = textFinder.findAll();
  // ユーザーが存在しない場合エラー
  if (!ranges[0])
    SHEET_USER.appendRow([userId, "???", '', 1]);
  // 投稿数プラス１
  const timesFinder = SHEET_USER.createTextFinder('投稿数');
  const timesRanges = timesFinder.findAll();
  const timesRow    = ranges[0].getRow();
  const timesColumn = timesRanges[0].getColumn();
  const times = SHEET_USER.getRange(timesRow, timesColumn).getValue() + 1;
  SHEET_USER.getRange(timesRow, timesColumn).setValue(times);
  // 今日の投稿数プラス１
  const todaysTimesFinder = SHEET_USER.createTextFinder(`今日の投稿数`);
  const todaysTimesRanges = todaysTimesFinder.findAll();
  const todaysTimesRow    = ranges[0].getRow();
  const todaysTimesColumn = todaysTimesRanges[0].getColumn();
  const todaysTimes = SHEET_USER.getRange(todaysTimesRow, todaysTimesColumn).getValue() + 1;
  SHEET_USER.getRange(todaysTimesRow, todaysTimesColumn).setValue(todaysTimes);
  // 更新日時を更新
  const updateDateFinder = SHEET_USER.createTextFinder('更新日時');
  const updateDateRanges = updateDateFinder.findAll();
  const updateDateRow    = ranges[0].getRow();
  const updateDateColumn = updateDateRanges[0].getColumn();
  const updateDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_USER.getRange(updateDateRow, updateDateColumn).setValue(updateDate);
}

// メンバーとしてユーザー登録されているか検索
function findUser(uid) {
  return getUserData().reduce(function(uuid, row) { return uuid || (row.key === uid && row.value); }, false) || undefined;
}

// ユーザー情報取得
function getUserData() {
  const data = SHEET_USER.getDataRange().getValues();
  return data.map(function(row) { return {key: row[0], value: row[1]}; });
}

// ChatGPTに読み込ませる過去のメッセージ取得
function chatGPTLog(userId, postMessage) {
  const numColumn = SHEET_LOG.getLastColumn(); // 最後列の列番号を取得
  const numRow    = SHEET_LOG.getLastRow()-1;  // 最後行の行番号を取得
  if (numRow < 1) {
    return [{"role": "user", "content": postMessage}];
  }
  const values = SHEET_LOG.getRange(2, 1, numRow, numColumn).getValues()
  let totalMessages = [];
  let count = 0
  for (i in values) {
    if (values[i][0] == userId) {
      if (count > MAX_COUNT_LOG)
        break; // 過去の履歴を遡る回数を超えたらfor文の処理を終了
      count++
      totalMessages.unshift({"role": "assistant", "content": values[i][3]});
      totalMessages.unshift({"role": "user", "content": values[i][2]});
    }
  }
  totalMessages.push({"role": "user", "content": postMessage});
  return totalMessages
}
