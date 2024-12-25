// 获取页面信息
function getPageInfo() {
  // 如果不是视频详情页，返回null
  if (!isVideoDetailPage()) {
    return null;
  }

  // 获取预览图
  let previewImage = "";
  // 尝试获取视频封面图
  const coverImage = document.querySelector(".column-video-cover img");
  if (coverImage) {
    previewImage = coverImage.src;
  }
  // 如果没有找到封面图，尝试获取预览图
  if (!previewImage) {
    const previewImg = document.querySelector(".preview-images img");
    if (previewImg) {
      previewImage = previewImg.src;
    }
  }

  // 获取网页标题
  let pageTitle = "";
  const titleElement = document.querySelector(
    ".video-detail h2 .current-title"
  );
  if (titleElement) {
    pageTitle = titleElement.textContent.trim();
  }

  // 获取番号
  let code = "";
  const codeElement = document.querySelector(".title .sav-id");
  if (codeElement) {
    code = codeElement.textContent.trim();
  }

  // 获取演员信息
  const actresses = [];
  const panelBlocks = document.querySelectorAll(".panel>.panel-block");
  if (panelBlocks.length >= 2) {
    const actressBlock = panelBlocks[panelBlocks.length - 2]; // 获取倒数第二个panel-block
    const actressLinks = actressBlock.querySelectorAll("span.value a");
    actressLinks.forEach((link) => {
      actresses.push({
        name: link.textContent.trim(),
        url: link.href,
      });
    });
  }

  return {
    url: window.location.href,
    title: pageTitle || document.title,
    code: code,
    timestamp: new Date().toISOString(),
    previewImage: previewImage,
    actresses: actresses,
  };
}

// 格式化时间
function formatDate(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 检查是否为视频详情页
function isVideoDetailPage() {
  const videoPattern = /^https:\/\/javdb\.com\/v\/[a-zA-Z0-9]{1,10}$/;
  return videoPattern.test(window.location.href);
}

// 创建并显示标签管理界面
function createTagManager() {
  // 如果不是视频详情页，不创建标签管理器
  if (!isVideoDetailPage()) {
    return;
  }

  // 移除现有的标签管理器
  const existingManager = document.getElementById("tag-manager-container");
  if (existingManager) {
    existingManager.remove();
  }

  // 创建标签管理容器
  const container = document.createElement("div");
  container.id = "tag-manager-container";
  container.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 15px;
    border-top: 1px solid #ddd;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9998;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 15px;
  `;

  // 创建输入区域
  const inputWrapper = document.createElement("div");
  inputWrapper.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "输入标签";
  input.style.cssText = `
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  `;

  const addButton = document.createElement("button");
  addButton.textContent = "添加标签";
  addButton.style.cssText = `
    padding: 6px 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(addButton);
  container.appendChild(inputWrapper);

  // 创建标签显示区域
  const tagsContainer = document.createElement("div");
  tagsContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  `;
  container.appendChild(tagsContainer);

  // 添加到页面
  document.body.appendChild(container);

  // 创建弹出层
  const modal = document.createElement("div");
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    max-width: 80%;
    max-height: 80vh;
    overflow-y: auto;
  `;
  document.body.appendChild(modal);

  // 创建遮罩层
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  `;
  overlay.onclick = () => {
    modal.style.display = "none";
    overlay.style.display = "none";
  };
  document.body.appendChild(overlay);

  // 创建标签元素
  function createTagElement(tagText, isClickable = true) {
    const tagElement = document.createElement("span");
    tagElement.textContent = tagText;
    tagElement.style.cssText = `
      display: inline-block;
      padding: 2px 8px;
      background-color: ${isClickable ? "#f0f0f0" : "#e0e0e0"};
      border-radius: 12px;
      font-size: 12px;
      color: #333;
      border: 1px solid #ddd;
      margin: 2px;
      ${isClickable ? "cursor: pointer;" : ""}
    `;
    return tagElement;
  }

  // 显示具有相同标签的页面
  function showPagesWithTag(tag) {
    chrome.storage.local.get(["tags", "pageInfo"], function (result) {
      const tags = result.tags || {};
      const pageInfo = result.pageInfo || {};
      const pages = [];

      // 收集所有具有该标签的页面
      Object.entries(tags).forEach(([url, urlTags]) => {
        if (urlTags.includes(tag)) {
          pages.push({
            url: url,
            title: pageInfo[url]?.title || url,
            code: pageInfo[url]?.code || "",
            timestamp: pageInfo[url]?.timestamp || null,
            previewImage: pageInfo[url]?.previewImage || null,
            actresses: pageInfo[url]?.actresses || [],
            tags: urlTags,
          });
        }
      });

      // 按时间戳排序（最新的在前面）
      pages.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      // 更新弹出层内容
      modal.innerHTML = "";
      modal.style.width = "800px"; // 设置固定宽度以适应图片

      // 添加标题
      const title = document.createElement("h3");
      title.textContent = `标签"${tag}"的所有页面`;
      title.style.cssText = `
        margin: 0 0 15px 0;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      `;
      modal.appendChild(title);

      // 添加页面列表
      if (pages.length > 0) {
        const ul = document.createElement("ul");
        ul.style.cssText = `
          list-style: none;
          padding: 0;
          margin: 0;
        `;

        pages.forEach((page) => {
          const li = document.createElement("li");
          li.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 4px;
            background: ${
              page.url === window.location.href ? "#f0f0f0" : "transparent"
            };
            border: 1px solid #eee;
            display: flex;
            gap: 15px;
          `;

          // 添加预览图
          if (page.previewImage) {
            const imageDiv = document.createElement("div");
            imageDiv.style.cssText = `
              flex-shrink: 0;
              width: 200px;
              height: 150px;
              overflow: hidden;
              border-radius: 4px;
              position: relative;
            `;

            const image = document.createElement("img");
            image.src = page.previewImage;
            image.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            `;
            imageDiv.appendChild(image);
            li.appendChild(imageDiv);
          }

          // 创建内容容器
          const contentDiv = document.createElement("div");
          contentDiv.style.cssText = `
            flex-grow: 1;
            min-width: 0;
          `;

          const link = document.createElement("a");
          link.href = page.url;
          link.style.cssText = `
            color: #1a0dab;
            text-decoration: none;
            display: block;
          `;
          link.target = "_blank";

          // 添加标题和番号
          const titleSpan = document.createElement("div");
          titleSpan.style.cssText = `
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 16px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `;

          // 如果有番号，显示在标题前面
          if (page.code) {
            const codeSpan = document.createElement("span");
            codeSpan.textContent = page.code;
            codeSpan.style.cssText = `
              color: #666;
              margin-right: 8px;
              font-family: monospace;
            `;
            titleSpan.appendChild(codeSpan);
          }

          const titleText = document.createElement("span");
          titleText.textContent = page.title;
          titleSpan.appendChild(titleText);

          link.appendChild(titleSpan);

          // 添加演员信息
          if (page.actresses && page.actresses.length > 0) {
            const actressDiv = document.createElement("div");
            actressDiv.style.cssText = `
              margin-bottom: 4px;
              font-size: 14px;
              color: #333;
            `;

            const actressLabel = document.createElement("span");
            actressLabel.textContent = "演员：";
            actressLabel.style.cssText = `
              color: #666;
              margin-right: 4px;
            `;
            actressDiv.appendChild(actressLabel);

            page.actresses.forEach((actress, index) => {
              const actressLink = document.createElement("a");
              actressLink.href = actress.url;
              actressLink.textContent = actress.name;
              actressLink.target = "_blank";
              actressLink.style.cssText = `
                color: #1a0dab;
                text-decoration: none;
                margin-right: 8px;
              `;
              actressDiv.appendChild(actressLink);

              // 添加分隔符（除了最后一个）
              if (index < page.actresses.length - 1) {
                const separator = document.createElement("span");
                separator.textContent = "、";
                separator.style.color = "#666";
                actressDiv.appendChild(separator);
              }
            });

            link.appendChild(actressDiv);
          }

          // 添加时间
          if (page.timestamp) {
            const timeSpan = document.createElement("div");
            timeSpan.textContent = `添加时间：${formatDate(page.timestamp)}`;
            timeSpan.style.cssText = `
              color: #666;
              font-size: 12px;
              margin-bottom: 8px;
            `;
            link.appendChild(timeSpan);
          }

          contentDiv.appendChild(link);

          // 添加标签区域
          const tagsDiv = document.createElement("div");
          tagsDiv.style.cssText = `
            margin-top: 8px;
          `;

          // 添加标签标题
          const tagsTitle = document.createElement("span");
          tagsTitle.textContent = "标签：";
          tagsTitle.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-right: 4px;
          `;
          tagsDiv.appendChild(tagsTitle);

          // 添加所有标签
          page.tags.forEach((pageTag) => {
            const tagElement = createTagElement(pageTag, pageTag !== tag);
            if (pageTag === tag) {
              tagElement.style.backgroundColor = "#4CAF50";
              tagElement.style.color = "white";
              tagElement.style.borderColor = "#4CAF50";
            } else {
              tagElement.onclick = () => showPagesWithTag(pageTag);
            }
            tagsDiv.appendChild(tagElement);
          });

          contentDiv.appendChild(tagsDiv);
          li.appendChild(contentDiv);
          ul.appendChild(li);
        });

        modal.appendChild(ul);
      } else {
        const noResults = document.createElement("p");
        noResults.textContent = "没有找到其他页面使用此标签";
        noResults.style.cssText = `
          color: #666;
          margin: 0;
        `;
        modal.appendChild(noResults);
      }

      // 显示弹出层
      modal.style.display = "block";
      overlay.style.display = "block";
    });
  }

  // 删除标签
  function deleteTag(tag) {
    const currentUrl = window.location.href;
    chrome.storage.local.get(["tags", "pageInfo"], function (result) {
      const tags = result.tags || {};
      const pageInfo = result.pageInfo || {};

      // 从当前页面的标签列表中删除该标签
      if (tags[currentUrl]) {
        const index = tags[currentUrl].indexOf(tag);
        if (index > -1) {
          // 如果这是最后一个标签，删除整个页面数据
          if (tags[currentUrl].length === 1) {
            delete tags[currentUrl];
            delete pageInfo[currentUrl];
          } else {
            tags[currentUrl].splice(index, 1);
          }
        }
      }

      // 保存更新后的数据
      chrome.storage.local.set(
        {
          tags: tags,
          pageInfo: pageInfo,
        },
        function () {
          // 重新加载标签显示
          updateTags();
        }
      );
    });
  }

  // 显示标签
  function displayTags() {
    const currentUrl = window.location.href;
    chrome.storage.local.get(["tags"], function (result) {
      const tags = result.tags || {};
      const currentTags = tags[currentUrl] || [];

      tagsContainer.innerHTML = "";
      currentTags.forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.className = "tag";

        // 创建标签文本
        const tagText = document.createElement("span");
        tagText.textContent = tag;
        tagText.className = "tag-text";
        tagElement.appendChild(tagText);

        // 创建删除按钮
        const deleteButton = document.createElement("span");
        deleteButton.textContent = "×";
        deleteButton.className = "tag-delete";
        deleteButton.onclick = (e) => {
          e.stopPropagation();
          // 只在这是最后一个标签时显示确认对话框
          if (currentTags.length === 1) {
            if (
              confirm(
                "这是最后一个标签，删除后会将本页面移出收藏夹。确定要删除吗？"
              )
            ) {
              deleteTag(tag);
            }
          } else {
            deleteTag(tag);
          }
        };
        tagElement.appendChild(deleteButton);

        // 点击标签显示相关页面
        tagElement.onclick = () => {
          showPagesWithTag(tag);
        };

        tagsContainer.appendChild(tagElement);
      });
    });
  }

  // 添加标签的处理函数
  addButton.onclick = function () {
    const tagText = input.value.trim();
    if (tagText) {
      chrome.storage.local.get(["tags", "pageInfo"], function (result) {
        const tags = result.tags || {};
        const pageInfo = result.pageInfo || {};
        const currentPageInfo = getPageInfo();

        if (!tags[currentPageInfo.url]) {
          tags[currentPageInfo.url] = [];
        }
        if (!tags[currentPageInfo.url].includes(tagText)) {
          tags[currentPageInfo.url].push(tagText);
          pageInfo[currentPageInfo.url] = {
            title: currentPageInfo.title,
            code: currentPageInfo.code,
            timestamp: currentPageInfo.timestamp,
            previewImage: currentPageInfo.previewImage,
            actresses: currentPageInfo.actresses,
          };

          // 保存标签和页面信息
          chrome.storage.local.set(
            {
              tags: tags,
              pageInfo: pageInfo,
            },
            function () {
              updateTags();
              input.value = "";
            }
          );
        }
      });
    }
  };

  // 回车键添加标签
  input.onkeypress = function (e) {
    if (e.key === "Enter") {
      addButton.click();
    }
  };

  // 初始显示标签
  function updateTags() {
    chrome.storage.local.get(["tags"], function (result) {
      const tags = result.tags || {};
      const currentUrl = window.location.href;
      const urlTags = tags[currentUrl] || [];

      tagsContainer.innerHTML = "";
      if (urlTags.length > 0) {
        urlTags.forEach((tag) => {
          const tagElement = document.createElement("span");
          tagElement.textContent = tag;
          tagElement.style.cssText = `
            display: inline-block;
            padding: 4px 12px;
            background-color: #f0f0f0;
            border-radius: 15px;
            font-size: 14px;
            color: #333;
            border: 1px solid #ddd;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
          `;

          // 点击标签显示相关页面
          tagElement.onclick = (e) => {
            if (!e.target.classList.contains("delete-btn")) {
              showPagesWithTag(tag);
            }
          };

          // 添加删除按钮
          const deleteBtn = document.createElement("span");
          deleteBtn.textContent = "×";
          deleteBtn.className = "delete-btn";
          deleteBtn.style.cssText = `
            cursor: pointer;
            color: #666;
            font-weight: bold;
          `;
          deleteBtn.onclick = function (e) {
            e.stopPropagation();
            // 只在这是最后一个标签时显示确认对话框
            if (urlTags.length === 1) {
              if (
                confirm(
                  "这是最后一个标签，删除后将移除此页面的所有数据。确定要删除吗？"
                )
              ) {
                deleteTag(tag);
              }
            } else {
              deleteTag(tag);
            }
          };
          tagElement.appendChild(deleteBtn);
          tagsContainer.appendChild(tagElement);
        });
      }
    });
  }

  updateTags();
}

// 确保页面完全加载后再创建标签管理器
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createTagManager);
} else {
  createTagManager();
}
