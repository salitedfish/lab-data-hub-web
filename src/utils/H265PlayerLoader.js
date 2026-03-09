// 本地封装的 h265web.js 加载器
class H265PlayerLoader {
  constructor() {
    this.H265Player = null;
    this.loading = false;
    this.loadPromise = null;
  }

  async load() {
    // 如果已加载，直接返回
    if (this.H265Player) {
      return this.H265Player;
    }

    // 如果正在加载，等待
    if (this.loading) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // 检查是否已通过 CDN 加载
      if (window.H265Player) {
        this.H265Player = window.H265Player;
        this.loading = false;
        resolve(this.H265Player);
        return;
      }

      // 尝试多种加载方式
      this.loadFromSources()
        .then((player) => {
          this.H265Player = player;
          resolve(player);
        })
        .catch(reject)
        .finally(() => {
          this.loading = false;
        });
    });

    return this.loadPromise;
  }

  async loadFromSources() {
    // 尝试顺序：CDN -> 本地文件 -> npm 包

    // 1. 先尝试 CDN
    try {
      return await this.loadFromCDN();
    } catch (error) {
      console.log('CDN 加载失败，尝试本地:', error);
    }

    // 2. 尝试加载本地文件
    try {
      return await this.loadFromLocal();
    } catch (error) {
      console.log('本地加载失败，尝试 npm:', error);
    }

    // 3. 最后尝试 npm 包
    try {
      return await this.loadFromNPM();
    } catch (error) {
      console.log('所有加载方式都失败:', error);
      throw new Error('无法加载 H.265 播放器');
    }
  }

  loadFromCDN() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/h265web.js@1.1.3/dist/h265web.js';
      script.onload = () => {
        if (window.H265Player) {
          resolve(window.H265Player);
        } else {
          reject(new Error('CDN 加载但未找到 H265Player'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadFromLocal() {
    // 如果你的服务器上有 h265web.js 文件
    const response = await fetch('/static/h265web/h265web.js');
    const scriptText = await response.text();

    // 创建 script 标签执行
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.textContent = scriptText;
      script.onload = () => {
        if (window.H265Player) {
          resolve(window.H265Player);
        } else {
          reject(new Error('本地文件加载但未找到 H265Player'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadFromNPM() {
    try {
      // 动态导入 npm 包（可能会有问题）
      const module = await import('h265web.js');
      return module.default || module;
    } catch (error) {
      throw new Error(`NPM 包加载失败: ${error.message}`);
    }
  }

  isLoaded() {
    return !!this.H265Player;
  }

  getPlayer() {
    return this.H265Player;
  }
}

// 创建单例实例
const h265PlayerLoader = new H265PlayerLoader();

export default h265PlayerLoader;
