/**
 * v-window
 * Author: yzt
 * Svg icons are from https://github.com/tailwindlabs/heroicons
 */

export default {
  mounted(el, binding, vnode, prevVnode) {
    bindWindowTrigger(el, binding);
  },
};

function bindWindowTrigger(el, binding) {
  // 在目标元素上绑定窗口化触发器，使之可以进入窗口模式
  // 先初始化一个全局触发按钮（只生成一次），以备后续使用
  let globalTriggerNode = document.getElementById("v-window-trigger");
  if (!globalTriggerNode) {
    globalTriggerNode = document.createElement("div");
    globalTriggerNode.id = "v-window-trigger";
    globalTriggerNode.className = "v-window-trigger";
    globalTriggerNode.title = "Open as a window";
    globalTriggerNode.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" /></svg>';
    globalTriggerNode.style =
      "width: 20px; height: 20px; background-color: #eee; border-radius: 5px; position: fixed; z-index: 99; display: none;";
    document.body.appendChild(globalTriggerNode);
  }

  let currentTriggerNode = null;
  let hideTimeoutFunc = null;

  const triggerFunc = function () {
    const vWindow = createWindow(binding.value);
    vWindow.setContentNode(el);
    el.setAttribute("v-windowed", "");
    currentTriggerNode.style.display = "none";
    vWindow.mount();
  };
  el.addEventListener("mouseenter", function (e) {
    if (e.target.hasAttribute("v-windowed")) {
      return;
    }
    clearTimeout(hideTimeoutFunc);
    currentTriggerNode = removeAllEventListener(
      document.getElementById("v-window-trigger")
    );
    const { offsetTop, offsetLeft } = getViewportOffset(el);
    currentTriggerNode.style.top = offsetTop + "px";
    currentTriggerNode.style.left = offsetLeft + el.clientWidth - 20 + "px";
    currentTriggerNode.style.display = "block";
    // 绑定触发窗口化的事件
    currentTriggerNode.addEventListener("click", triggerFunc);
    hideTimeoutFunc = setTimeout(function () {
      if (currentTriggerNode) {
        currentTriggerNode.style.display = "none";
      }
    }, 5000);
  });
}

function createWindow(windowName) {
  // 创建窗口根节点
  const windowNode = document.createElement("div");
  windowNode.className = "v-window";
  windowNode.style =
    "height: 25px; width: 100px; box-sizing: border-box; position: fixed; border: 1px solid #666; background-color: #fff; display: flex; flex-direction: column; z-index: 999;";
  windowNode.addEventListener("mousedown", function () {
    setTopWindow(windowNode);
  });

  // 创建标题节点
  const titleNode = document.createElement("div");
  titleNode.className = "v-window-title";
  titleNode.style =
    "height: 25px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; font-size: 12px; background-color: #ddd; user-select: none; cursor: move;";
  titleNode.innerHTML = `<span>${windowName}</span>`;
  windowNode.appendChild(titleNode);

  // 绑定拖拽事件
  bindDragEvent(titleNode);

  // 创建resize小元素
  const resizeNode = document.createElement("div");
  resizeNode.className = "v-window-resize";
  resizeNode.style =
    "width: 5px; height: 5px; position: absolute; right: 0px; bottom: 0px; cursor: se-resize; z-index: 9;";
  windowNode.append(resizeNode);

  // 绑定resize事件
  bindResizeEvent(resizeNode);

  return {
    windowName,
    windowNode,
    titleNode, // 标题栏
    contentContainerNode: null,
    placeholder: null, // 占位节点
    nodeInfo: {
      node: null, // 目标节点
      parentNode: null, // 原始节点的父节点
    }, // 原始节点的信息存档
    setContentNode(node) {
      if (this.contentContainerNode) {
        this.windowNode.removeChild(this.contentContainerNode);
      }

      // 记录原始节点数据
      this.nodeInfo.node = node;
      this.nodeInfo.parentNode = node.parentNode;
      this.nodeInfo.width = node.offsetWidth;
      this.nodeInfo.height = node.offsetHeight;
      const { offsetTop, offsetLeft } = getViewportOffset(node);
      this.nodeInfo.top = offsetTop;
      this.nodeInfo.left = offsetLeft;
      const { marginTop, marginRight, marginBottom, marginLeft } =
        document.defaultView.getComputedStyle(node, null);
      this.nodeInfo.marginTop = parseInt(marginTop.replace("px", "")) || 0;
      this.nodeInfo.marginRight = parseInt(marginRight.replace("px", "")) || 0;
      this.nodeInfo.marginBottom =
        parseInt(marginBottom.replace("px", "")) || 0;
      this.nodeInfo.marginLeft = parseInt(marginLeft.replace("px", "")) || 0;
      this.nodeInfo.display = getStyleByName(node, "display");
      this.nodeInfo.verticalAlign = getStyleByName(node, "verticalAlign");

      // 创建占位节点
      this.placeholder = document.createElement("div");
      const phContent = document.createElement("div");
      this.placeholder.className = "v-window-placeholder";
      this.placeholder.style = `display: ${
        this.nodeInfo.display === "inline"
          ? "inline-block"
          : this.nodeInfo.display
      }; margin-top: ${this.nodeInfo.marginTop}px; margin-right: ${
        this.nodeInfo.marginRight
      }px; margin-bottom: ${this.nodeInfo.marginBottom}px; margin-left: ${
        this.nodeInfo.marginLeft
      }px;`;
      phContent.style = `width: ${this.nodeInfo.width}px; height: ${this.nodeInfo.height}px; padding: 5px; box-sizing: border-box; border: 5px dashed #eee; border-radius: 12px; font-weight: bolder; color: #eee; overflow-wrap: anywhere; display: flex; align-items: center; justify-content: center;`;
      phContent.innerText = this.windowName;
      this.placeholder.appendChild(phContent);

      // 创建内容容器节点
      this.contentContainerNode = document.createElement("div");
      this.contentContainerNode.className = "v-window-content-container";
      this.contentContainerNode.style = "flex-grow: 1; overflow: auto;";
      this.nodeInfo.parentNode.insertBefore(this.placeholder, node); // 放置占位节点
      this.contentContainerNode.appendChild(node); // 剪切目标节点至窗口内容容器
      node.style.margin = "0px";
      node.style.verticalAlign = "top"; // 解决inline/inline-block元素默认基于baseline而出现滚动条的问题
      this.windowNode.appendChild(this.contentContainerNode);

      // 重置窗口大小
      this.windowNode.style.width = this.nodeInfo.width + 2 + "px"; // 2为边框距离
      this.windowNode.style.height = this.nodeInfo.height + 25 + 2 + "px"; // 25为标题栏大小, 2为边框距离

      // 重置窗口位置
      this.windowNode.style.top = Math.max(this.nodeInfo.top - 25, 0) + "px";
      this.windowNode.style.left = this.nodeInfo.left + "px";

      // 创建窗口右上角按钮面板
      const buttonPanelNode = document.createElement("div");
      buttonPanelNode.className = "v-window-button-panel";
      buttonPanelNode.style =
        "position: absolute; right: 0px; display: flex; align-items: center; margin-right: 5px; cursor: default;";
      buttonPanelNode.addEventListener("mousedown", (e) => {
        // 防止触发拖拽事件，下同
        e.stopPropagation();
      });
      buttonPanelNode.addEventListener("mouseup", (e) => {
        e.stopPropagation();
      });

      // 创建关闭按钮
      const closeButtonNode = document.createElement("span");
      closeButtonNode.className = "v-window-close-button";
      closeButtonNode.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';
      closeButtonNode.style =
        "width: 15px; height: 15px; display: flex; align-items: center;";
      buttonPanelNode.appendChild(closeButtonNode);
      closeButtonNode.addEventListener("click", (e) => {
        e.stopPropagation();
        this.nodeInfo.node.removeAttribute("v-windowed");
        this.nodeInfo.parentNode.insertBefore(
          this.nodeInfo.node,
          this.placeholder
        );
        this.nodeInfo.node.style.margin = `${this.nodeInfo.marginTop}px ${this.nodeInfo.marginRight}px ${this.nodeInfo.marginBottom}px ${this.nodeInfo.marginLeft}px`;
        this.nodeInfo.node.style.verticalAlign = this.nodeInfo.verticalAlign;
        this.nodeInfo.parentNode.removeChild(this.placeholder);
        document.body.removeChild(this.windowNode);
      });

      this.titleNode.appendChild(buttonPanelNode);
    },
    mount() {
      // body挂载窗口节点
      document.body.appendChild(this.windowNode);
      // 将新挂载的window放到所有窗口最顶层
      setTopWindow(this.windowNode);
    },
  };
}

function bindDragEvent(titleNode) {
  let mouseX = 0;
  let mouseY = 0;
  let nodeX = 0;
  let nodeY = 0;
  const windowNode = titleNode.parentNode;

  const dragFunc = function (e) {
    let offsetX = e.clientX - mouseX;
    let offsetY = e.clientY - mouseY;
    windowNode.style.left = nodeX + offsetX + "px";
    windowNode.style.top = nodeY + offsetY + "px";
  };

  titleNode.addEventListener("mousedown", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    nodeX = windowNode.offsetLeft;
    nodeY = windowNode.offsetTop;
    document.addEventListener("mousemove", dragFunc);
  });

  titleNode.addEventListener("mouseup", function () {
    document.removeEventListener("mousemove", dragFunc);
  });
}

function bindResizeEvent(resizeNode) {
  let mouseX = 0;
  let mouseY = 0;
  let windowWidth = 0;
  let windowHeight = 0;
  const windowNode = resizeNode.parentNode;

  const resizeFunc = function (e) {
    e.preventDefault();
    let offsetX = e.clientX - mouseX;
    let offsetY = e.clientY - mouseY;
    windowNode.style.width = Math.max(windowWidth + offsetX, 100) + "px";
    windowNode.style.height = Math.max(windowHeight + offsetY, 100) + "px";
  };

  const cleanFunc = function () {
    document.removeEventListener("mousemove", resizeFunc);
    document.removeEventListener("mouseup", cleanFunc, true);
  };

  resizeNode.addEventListener("mousedown", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    windowWidth = windowNode.offsetWidth;
    windowHeight = windowNode.offsetHeight;
    if (!windowNode.style.top || !windowNode.style.left) {
      windowNode.style.top = windowNode.offsetTop + "px";
      windowNode.style.left = windowNode.offsetLeft + "px";
    }
    document.addEventListener("mousemove", resizeFunc);
    document.addEventListener("mouseup", cleanFunc, true);
  });
}

function getStyleByName(node, styleName) {
  if (document.defaultView) {
    return document.defaultView.getComputedStyle(node, null)[styleName];
  }
  return "";
}

function removeAllEventListener(node) {
  const newNode = node.cloneNode(true);
  node.replaceWith(newNode);
  return newNode;
}

function getViewportOffset(node) {
  let offsetTop = node.offsetTop;
  let offsetLeft = node.offsetLeft;
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  while (node.offsetParent) {
    node = node.offsetParent;
    offsetTop += node.offsetTop;
    offsetLeft += node.offsetLeft;
  }
  offsetTop -= scrollY;
  offsetLeft -= scrollX;
  return { offsetTop, offsetLeft };
}

let vWindowZIndex = 999;
function setTopWindow(windowNode) {
  // 为了防止因为统一改变zIndex而导致现场已有顺序被改变影响体验，这里采用递增zIndex的方法
  if (vWindowZIndex + 1 > 5000000) {
    // 虽然不太可能有点到溢出的场景，但是为了防止溢出，人为控制在一个比较大的范围内，到了就重置
    const windowNodes = document.getElementsByClassName("v-window");
    for (let node of windowNodes) {
      node.style.zIndex = "999";
    }
    vWindowZIndex = 999;
  }
  windowNode.style.zIndex = ++vWindowZIndex;
}
