document.addEventListener('DOMContentLoaded', function() {
  const tagInput = document.getElementById('tagInput');
  const addTagButton = document.getElementById('addTag');
  const tagList = document.getElementById('tagList');

  // 加载已保存的标签
  chrome.storage.local.get(['tags'], function(result) {
    const tags = result.tags || {};
    updateTagList(tags);
  });

  // 添加标签按钮点击事件
  addTagButton.addEventListener('click', function() {
    const tagText = tagInput.value.trim();
    if (tagText) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        chrome.storage.local.get(['tags'], function(result) {
          const tags = result.tags || {};
          if (!tags[url]) {
            tags[url] = [];
          }
          if (!tags[url].includes(tagText)) {
            tags[url].push(tagText);
            chrome.storage.local.set({tags: tags}, function() {
              updateTagList(tags);
              tagInput.value = '';
            });
          }
        });
      });
    }
  });

  function updateTagList(tags) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const url = tabs[0].url;
      const urlTags = tags[url] || [];
      tagList.innerHTML = '';
      urlTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.textContent = tag;
        tagList.appendChild(tagElement);
      });
    });
  }
});
