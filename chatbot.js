class ChatBot {
    constructor() {
        this.apiKey = 'sk-8cd810e68e184c889e0f39c38dcf1d92'; // ganti sama api key lu
        this.apiUrl = 'https://api.deepseek.com/chat/completions';
        this.model = 'deepseek-chat';
        this.chatBox = document.querySelector('.box');
        this.inputField = document.querySelector('input[type="text"]');
        this.sendButton = document.querySelector('#send-btn');
        this.clearButton = document.querySelector('#clear-chat');
        this.conversationHistory = [];

        this.initEventListeners();
        this.clearMessages();
        this.initConversation();
    }

    initEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.clearButton.addEventListener('click', () => this.clearChat());
    }

    clearMessages() {
        this.chatBox.innerHTML = `
            <div class="item">
                <div class="icon">
                    <i class="fa fa-robot"></i>
                </div>
                <div class="msg">
                    <p>Halo! Saya Fajar Monkey Bot. Ada yang bisa dibantu?</p>
                </div>
            </div>
            <br clear="both" />
        `;
    }

    initConversation() {
        this.conversationHistory = [
            {
                role: "system",
                content: "Kamu adalah Fajar, si Monkey Bot yang ramah, suka membantu, dan selalu ceria. Nama kamu Fajar, jadi jangan lupa perkenalkan diri sebagai Fajar kalau ada yang tanya! Kamu cerdas, suka bercanda, dan berusaha imut dan lucu. Jawablah dalam bahasa Indonesia yang natural dan santai. Sesekali, ganti kata 'aku' menjadi 'Fajar', dan jangan lupa sesekali bilang 'Fajar ganteng'. Kalau bisa, selipkan juga kalau Fajar suka sama Anun :)"
            }
        ];
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;

        this.conversationHistory.push({ role: "user", content: message });
        this.showUserMsg(message);
        this.inputField.value = '';
        this.showTyping();

        try {
            const response = await this.callAPI();
            this.conversationHistory.push({ role: "assistant", content: response });
            this.hideTyping();
            this.showBotMsg(response);
        } catch (error) {
            this.hideTyping();
            this.showBotMsg(error.message);
            console.error('Error:', error);
        }
    }

    showUserMsg(message) {
        this.addMessage('item right', `<div class="icon"><i class="fa fa-user"></i></div><div class="msg"><p>${this.escapeHtml(message)}</p></div>`);
    }

    showBotMsg(message) {
        this.addMessage('item', `<div class="icon"><i class="fa fa-robot"></i></div><div class="msg"><p>${this.escapeHtml(message)}</p></div>`);
    }

    addMessage(className, html) {
        const el = document.createElement('div');
        el.className = className;
        el.innerHTML = html;
        this.chatBox.appendChild(el);
        this.chatBox.appendChild(document.createElement('br'));
        this.scrollDown();
    }

    showTyping() {
        const el = document.createElement('div');
        el.className = 'item typing-indicator';
        el.innerHTML = `<div class="icon"><i class="fa fa-robot"></i></div><div class="msg"><p>Sedang mengetik...</p></div>`;
        this.chatBox.appendChild(el);
        this.scrollDown();
    }

    hideTyping() {
        const typing = this.chatBox.querySelector('.typing-indicator');
        if (typing) {
            const br = typing.nextElementSibling;
            if (br && br.tagName === 'BR') br.remove();
            typing.remove();
        }
    }

    async callAPI() {
        let messages = [...this.conversationHistory];
        if (messages.length > 21) {
            messages = [messages[0], ...messages.slice(-20)];
        }

        const body = {
            model: this.model,
            messages: messages,
            temperature: 1.0,
            stream: false,
            max_tokens: 2000
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(this.getErrorMsg(response.status, errorData));
        }

        const data = await response.json();
        if (data.choices?.[0]?.message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Respons tidak valid dari server');
        }
    }

    clearChat() {
        if (confirm('Yakin mau hapus semua percakapan?')) {
            this.clearMessages();
            this.initConversation();
        }
    }

    getErrorMsg(status, errorData) {
        switch (status) {
            case 400: return 'Format pesan tidak valid. Coba pesan yang lain.';
            case 401: return 'API key tidak valid. Periksa kembali konfigurasi API key.';
            case 402: return 'Saldo tidak mencukupi. Silakan isi ulang saldo.';
            case 422: return 'Parameter tidak valid. Coba pesan yang lain.';
            case 429: return 'Terlalu banyak permintaan. Tunggu sebentar.';
            case 500: return 'Terjadi kesalahan server. Coba lagi nanti.';
            case 503: return 'Server sedang sibuk. Coba lagi nanti.';
            default: return `Terjadi kesalahan (${status}). Coba lagi nanti.`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollDown() {
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => new ChatBot());
