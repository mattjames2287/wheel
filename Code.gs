
function doPost(e){

const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("activities");

const data = JSON.parse(e.postData.contents);

sheet.appendRow([
data.emoji,
data.activity,
data.price,
data.restaurant,
data.movie,
new Date()
]);

return ContentService.createTextOutput("ok");

}
