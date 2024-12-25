// 格式化时间
function formatDate(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 全局变量
const PAGE_SIZE = 20; // 每页显示的数量
let currentPage = 1;
let currentTag = null;

// 删除页面
function deletePage(url) {
  chrome.storage.local.get(['tags', 'pageInfo'], function(result) {
    const tags = result.tags || {};
    const pageInfo = result.pageInfo || {};
    
    // 删除页面数据
    delete tags[url];
    delete pageInfo[url];

    // 保存更新后的数据
    chrome.storage.local.set({ 
      tags: tags,
      pageInfo: pageInfo
    }, function() {
      // 如果在查看特定标签，刷新标签页面
      if (currentTag) {
        showPages(currentTag, currentPage);
      } else {
        // 否则刷新所有页面
        showAllPages(currentPage);
      }
    });
  });
}

// 创建分页控件
function createPagination(totalPages, currentPage, onPageChange) {
  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  // 上一页按钮
  if (currentPage > 1) {
    const prevButton = document.createElement('span');
    prevButton.className = 'page-button';
    prevButton.textContent = '上一页';
    prevButton.addEventListener('click', () => onPageChange(currentPage - 1));
    pagination.appendChild(prevButton);
  }

  // 页码按钮
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // 第一页
      i === totalPages || // 最后一页
      (i >= currentPage - 2 && i <= currentPage + 2) // 当前页附近的页码
    ) {
      const pageButton = document.createElement('span');
      pageButton.className = `page-button ${i === currentPage ? 'current' : ''}`;
      pageButton.textContent = i;
      pageButton.addEventListener('click', () => onPageChange(i));
      pagination.appendChild(pageButton);
    } else if (
      (i === currentPage - 3 && currentPage > 4) ||
      (i === currentPage + 3 && currentPage < totalPages - 3)
    ) {
      // 添加省略号
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '...';
      pagination.appendChild(ellipsis);
    }
  }

  // 下一页按钮
  if (currentPage < totalPages) {
    const nextButton = document.createElement('span');
    nextButton.className = 'page-button';
    nextButton.textContent = '下一页';
    nextButton.addEventListener('click', () => onPageChange(currentPage + 1));
    pagination.appendChild(nextButton);
  }

  return pagination;
}

// 显示页面列表
function showPagesList(pages, container, startIndex, endIndex) {
  pages.slice(startIndex, endIndex).forEach(page => {
    const pageElement = document.createElement('div');
    pageElement.className = 'page-item';

    // 创建页面HTML
    let pageHTML = '';
    
    // 添加预览图
    if (page.previewImage) {
      pageHTML += `<img src="${page.previewImage}" class="page-image" alt="预览图">`;
    }

    pageHTML += '<div class="page-info">';
    
    // 添加标题栏，包含标题和删除按钮
    pageHTML += '<div class="page-header">';
    
    // 添加标题和番号
    const titleHTML = page.code 
      ? `<div class="page-title"><span class="page-code">${page.code}</span>${page.title}</div>`
      : `<div class="page-title">${page.title}</div>`;
    pageHTML += `<a href="${page.url}" target="_blank">${titleHTML}</a>`;
    
    // 添加删除按钮
    pageHTML += `
      <button class="delete-button" data-url="${page.url}">
        删除
      </button>
    `;
    
    pageHTML += '</div>'; // 关闭page-header

    pageHTML += `<div class="page-url">${page.url}</div>`;

    // 添加演员信息
    if (page.actresses && page.actresses.length > 0) {
      pageHTML += '<div class="page-actresses">演员：';
      pageHTML += page.actresses.map(actress => 
        `<a href="${actress.url}" target="_blank" class="actress-link">${actress.name}</a>`
      ).join('、');
      pageHTML += '</div>';
    }

    // 添加时间信息
    if (page.timestamp) {
      pageHTML += `<div class="page-time">添加时间：${formatDate(page.timestamp)}</div>`;
    }

    // 添加标签
    pageHTML += '<div class="page-tags">';
    page.tags.forEach(pageTag => {
      const isCurrentTag = pageTag === currentTag;
      pageHTML += `
        <span class="page-tag" style="${isCurrentTag ? 'background:#4CAF50;color:white' : ''}"
              data-tag="${pageTag}">${pageTag}</span>
      `;
    });
    pageHTML += '</div>';

    pageHTML += '</div>';
    pageElement.innerHTML = pageHTML;

    // 为删除按钮添加事件监听器
    const deleteButton = pageElement.querySelector('.delete-button');
    deleteButton.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (confirm('确定要将此页面移出收藏夹吗？')) {
        deletePage(url);
      }
    });

    // 为标签添加事件监听器
    const tagElements = pageElement.querySelectorAll('.page-tag');
    tagElements.forEach(tagElement => {
      tagElement.addEventListener('click', function() {
        const tag = this.getAttribute('data-tag');
        showPages(tag);
      });
    });

    container.appendChild(pageElement);
  });
}

// 获取所有数据并显示统计信息
function loadData() {
  chrome.storage.local.get(['tags', 'pageInfo'], function(result) {
    const tags = result.tags || {};
    const pageInfo = result.pageInfo || {};
    
    // 计算统计信息
    const totalPages = Object.keys(tags).length;
    const allTags = new Set();
    Object.values(tags).forEach(pageTags => {
      pageTags.forEach(tag => allTags.add(tag));
    });
    const totalTags = allTags.size;

    // 显示统计信息
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = `
      <div>总页面数：${totalPages}</div>
      <div>总标签数：${totalTags}</div>
    `;

    // 统计每个标签的使用次数
    const tagCounts = {};
    Object.values(tags).forEach(pageTags => {
      pageTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // 按使用次数排序标签
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    // 显示标签列表
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';
    sortedTags.forEach(({ tag, count }) => {
      const tagElement = document.createElement('div');
      tagElement.className = `tag ${tag === currentTag ? 'active' : ''}`;
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-count">${count}</span>
      `;
      tagElement.addEventListener('click', () => showPages(tag));
      tagList.appendChild(tagElement);
    });

    // 设置搜索功能
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
      const searchText = this.value.toLowerCase();
      const tagElements = tagList.getElementsByClassName('tag');
      Array.from(tagElements).forEach(element => {
        const tagText = element.textContent.toLowerCase();
        element.style.display = tagText.includes(searchText) ? '' : 'none';
      });
    });

    // 如果没有选中的标签，显示所有页面
    if (!currentTag) {
      showAllPages();
    }
  });
}

// 显示所有页面
function showAllPages(pageNum = 1) {
  chrome.storage.local.get(['tags', 'pageInfo'], function(result) {
    const tags = result.tags || {};
    const pageInfo = result.pageInfo || {};
    const pages = [];

    // 收集所有页面
    Object.entries(tags).forEach(([url, urlTags]) => {
      pages.push({
        url,
        title: pageInfo[url]?.title || url,
        code: pageInfo[url]?.code || '',
        timestamp: pageInfo[url]?.timestamp || null,
        previewImage: pageInfo[url]?.previewImage || null,
        actresses: pageInfo[url]?.actresses || [],
        tags: urlTags
      });
    });

    // 按时间戳排序
    pages.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // 计算分页
    const totalPages = Math.ceil(pages.length / PAGE_SIZE);
    currentPage = pageNum;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    // 显示页面列表
    const pagesContainer = document.getElementById('pagesContainer');
    pagesContainer.innerHTML = `<h2>所有页面（${pages.length}）</h2>`;
    
    // 显示当前页的内容
    showPagesList(pages, pagesContainer, startIndex, endIndex);

    // 添加分页控件
    const pagination = createPagination(totalPages, currentPage, (page) => {
      showAllPages(page);
    });
    pagesContainer.appendChild(pagination);
  });
}

// 显示具有特定标签的页面
function showPages(tag, pageNum = 1) {
  currentTag = tag;
  chrome.storage.local.get(['tags', 'pageInfo'], function(result) {
    const tags = result.tags || {};
    const pageInfo = result.pageInfo || {};
    const pages = [];

    // 收集所有具有该标签的页面
    Object.entries(tags).forEach(([url, urlTags]) => {
      if (urlTags.includes(tag)) {
        pages.push({
          url,
          title: pageInfo[url]?.title || url,
          code: pageInfo[url]?.code || '',
          timestamp: pageInfo[url]?.timestamp || null,
          previewImage: pageInfo[url]?.previewImage || null,
          actresses: pageInfo[url]?.actresses || [],
          tags: urlTags
        });
      }
    });

    // 按时间戳排序
    pages.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // 计算分页
    const totalPages = Math.ceil(pages.length / PAGE_SIZE);
    currentPage = pageNum;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    // 显示页面列表
    const pagesContainer = document.getElementById('pagesContainer');
    pagesContainer.innerHTML = `<h2>标签"${tag}"的页面（${pages.length}）</h2>`;
    
    // 显示当前页的内容
    showPagesList(pages, pagesContainer, startIndex, endIndex);

    // 添加分页控件
    const pagination = createPagination(totalPages, currentPage, (page) => {
      showPages(tag, page);
    });
    pagesContainer.appendChild(pagination);

    // 更新标签列表的选中状态
    loadData();
  });
}

// 搜索页面
function searchPages(query) {
  chrome.storage.local.get(['tags', 'pageInfo'], function(result) {
    const tags = result.tags || {};
    const pageInfo = result.pageInfo || {};
    const pages = [];
    const searchText = query.toLowerCase();

    // 收集所有页面
    Object.entries(tags).forEach(([url, urlTags]) => {
      const info = pageInfo[url] || {};
      
      // 检查是否匹配搜索条件
      const matchesSearch = 
        // 搜索标题
        (info.title || '').toLowerCase().includes(searchText) ||
        // 搜索番号
        (info.code || '').toLowerCase().includes(searchText) ||
        // 搜索标签
        urlTags.some(tag => tag.toLowerCase().includes(searchText)) ||
        // 搜索演员
        (info.actresses || []).some(actress => 
          actress.name.toLowerCase().includes(searchText)
        );

      if (matchesSearch) {
        pages.push({
          url,
          title: info.title || url,
          code: info.code || '',
          timestamp: info.timestamp || null,
          previewImage: info.previewImage || null,
          actresses: info.actresses || [],
          tags: urlTags
        });
      }
    });

    // 按时间戳排序
    pages.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // 显示搜索结果
    const pagesContainer = document.getElementById('pagesContainer');
    pagesContainer.innerHTML = `<h2>搜索结果（${pages.length}）</h2>`;
    
    // 计算分页
    const totalPages = Math.ceil(pages.length / PAGE_SIZE);
    currentPage = 1;
    const startIndex = 0;
    const endIndex = PAGE_SIZE;

    // 显示当前页的内容
    showPagesList(pages, pagesContainer, startIndex, endIndex);

    // 添加分页控件
    if (pages.length > PAGE_SIZE) {
      const pagination = createPagination(totalPages, currentPage, (page) => {
        const newStartIndex = (page - 1) * PAGE_SIZE;
        const newEndIndex = newStartIndex + PAGE_SIZE;
        pagesContainer.innerHTML = `<h2>搜索结果（${pages.length}）</h2>`;
        showPagesList(pages, pagesContainer, newStartIndex, newEndIndex);
        pagesContainer.appendChild(pagination);
      });
      pagesContainer.appendChild(pagination);
    }
  });
}

// 初始加载
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  
  // 为搜索框添加事件监听器
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      
      // 清除之前的定时器
      clearTimeout(searchTimeout);
      
      // 如果搜索框为空，显示所有页面
      if (!query) {
        showAllPages();
        return;
      }
      
      // 设置300ms的防抖
      searchTimeout = setTimeout(() => {
        searchPages(query);
      }, 300);
    });

    // 添加清除按钮
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-search';
    clearButton.textContent = '×';
    clearButton.style.display = 'none';
    searchInput.parentNode.insertBefore(clearButton, searchInput.nextSibling);

    // 显示/隐藏清除按钮
    searchInput.addEventListener('input', function() {
      clearButton.style.display = this.value ? 'block' : 'none';
    });

    // 清除搜索
    clearButton.addEventListener('click', function() {
      searchInput.value = '';
      clearButton.style.display = 'none';
      showAllPages();
    });
  }
});
