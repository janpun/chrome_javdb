// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
  // 打开选项页面
  chrome.runtime.openOptionsPage();
});
