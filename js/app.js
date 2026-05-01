window.app = {
    navigate: () => console.log('App loading...'),
    filterCategory: () => console.log('App loading...'),
    openTool: () => console.log('App loading...')
};

class App {
    constructor() {
        this.currentView = 'home';
        this.currentTool = null;
        this.allTools = [];
        this.init();
    }

    init() {
        try {
            this.allTools = [...(window.imageTools || []), ...(window.pdfTools || [])];
        } catch (e) {
            console.error('Failed to load tools array', e);
            this.allTools = [];
        }

        // Initialize Icons
        try {
            lucide.createIcons();
        } catch (e) {
            console.error('Lucide error:', e);
        }

        // Theme Setup
        this.initTheme();

        // Handle Routing based on URL hash
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();

        // Render Home Cards
        this.renderToolCards(this.allTools);
    }

    initTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggleBtn.innerHTML = '<i data-lucide="sun"></i>';
        }

        toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                toggleBtn.innerHTML = '<i data-lucide="moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                toggleBtn.innerHTML = '<i data-lucide="sun"></i>';
            }
            lucide.createIcons();
        });
    }

    handleRoute() {
        const hash = window.location.hash.substring(1);
        if (!hash || hash === 'home') {
            this.navigate('home');
            this.filterCategory('all');
        } else {
            const tool = this.allTools.find(t => t.id === hash);
            if (tool) {
                this.openTool(tool);
            } else {
                this.navigate('home');
            }
        }
    }

    navigate(viewId) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });

        if (viewId === 'home') {
            document.getElementById('view-home').classList.remove('hidden');
            setTimeout(() => document.getElementById('view-home').classList.add('active'), 10);
            window.location.hash = '';
            this.currentTool = null;
        } else {
            document.getElementById('view-tool').classList.remove('hidden');
            setTimeout(() => document.getElementById('view-tool').classList.add('active'), 10);
        }
    }

    filterCategory(category) {
        const filtered = category === 'all' ? this.allTools : this.allTools.filter(t => t.category === category);
        this.renderToolCards(filtered);
    }

    renderToolCards(tools) {
        const container = document.getElementById('tools-container');
        container.innerHTML = '';

        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.onclick = () => {
                window.location.hash = tool.id;
            };

            card.innerHTML = `
                <div class="tool-icon">
                    <i data-lucide="${tool.icon}"></i>
                </div>
                <h3>${tool.title}</h3>
                <p>${tool.description}</p>
            `;
            container.appendChild(card);
        });
        
        lucide.createIcons();
    }

    openTool(tool) {
        this.currentTool = tool;
        this.navigate('tool');
        
        // Setup Tool Workspace Header
        document.getElementById('workspace-title').textContent = tool.title;
        document.getElementById('workspace-icon').innerHTML = `<i data-lucide="${tool.icon}"></i>`;
        
        // Clear previous body
        const body = document.getElementById('workspace-body');
        body.innerHTML = '';
        
        // Render Tool UI
        if (typeof tool.renderUI === 'function') {
            tool.renderUI(body);
        }
        
        try {
            lucide.createIcons();
        } catch (e) {
            console.error('Lucide error:', e);
        }
    }
}

// Global utility functions for UI
window.ui = {
    createUploadArea: (multiple = false, accept = "*", onChange) => {
        const div = document.createElement('div');
        div.className = 'upload-area';
        div.innerHTML = `
            <i data-lucide="upload-cloud" class="upload-icon"></i>
            <h3>اسحب وأفلت الملفات هنا أو اضغط للاختيار</h3>
            <p>الملفات المدعومة: ${accept}</p>
            <input type="file" ${multiple ? 'multiple' : ''} accept="${accept}">
        `;
        
        const input = div.querySelector('input');
        input.addEventListener('change', (e) => {
            if(e.target.files.length > 0) onChange(e.target.files);
        });

        // Drag and drop effects
        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            div.classList.add('dragover');
        });
        div.addEventListener('dragleave', () => {
            div.classList.remove('dragover');
        });
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            div.classList.remove('dragover');
            if(e.dataTransfer.files.length > 0) onChange(e.dataTransfer.files);
        });

        return div;
    },
    
    formatBytes: (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    downloadBlob: (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new App();
    } catch (error) {
        console.error('App initialization failed:', error);
    }
});
