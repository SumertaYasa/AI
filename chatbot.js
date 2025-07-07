// ChatBot - Manages interactions with the DeepSeek API
class ChatBot {
    constructor() {
        this.config = {
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-chat',
            maxTokens: 2000,
            temperature: 0.7,
            maxHistoryLength: 20
        };

        // API key should ideally be stored on a backend
        this.apiKey = this.getApiKey();
        this.elements = {
            chatBox: document.querySelector('.box'),
            inputField: document.querySelector('input[type="text"]'),
            sendButton: document.querySelector('#send-btn'),
            clearButton: document.querySelector('#clear-chat')
        };

        this.conversationHistory = [];
        this.isWaitingForResponse = false;

        this.initEventListeners();
        this.clearMessages();
        this.initConversation();
    }

    // Placeholder for secure API key retrieval
    getApiKey() {
        // In production, implement a secure method to obtain the API key
        // For example, use a backend endpoint that requires authentication
        return 'sk-8cd810e68e184c889e0f39c38dcf1d92';
    }

    initEventListeners() {
        const { sendButton, inputField, clearButton } = this.elements;

        sendButton.addEventListener('click', () => this.sendMessage());
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        clearButton.addEventListener('click', () => this.clearChat());

        inputField.addEventListener('input', () => {
            sendButton.disabled = !inputField.value.trim();
        });
        sendButton.disabled = true;
    }

    clearMessages() {
        const { chatBox } = this.elements;
        chatBox.innerHTML = '';
        this.showBotMsg("Halo! Saya ChatBot Kelompok 1. Ada yang bisa dibantu?");
    }

    initConversation() {
        this.conversationHistory = [
            {
                role: "system",
                content: "Kamu adalah asisten AI yang ramah dan pintar. Kamu selalu berusaha membantu pengguna dengan jawaban yang ringkas, mudah dimengerti, dan akurat. Jika ditanya soal teknis, kamu jawab to the point. Jika tidak tahu, jujur katakan. Hindari basa-basi, tetap profesional, tapi boleh sedikit santai tergantung gaya bicara pengguna."
            }
        ];
    }

    async sendMessage() {
        const { inputField, sendButton } = this.elements;
        const message = inputField.value.trim();

        if (!message || this.isWaitingForResponse) return;

        this.conversationHistory.push({ role: "user", content: message });
        this.showUserMsg(message);

        inputField.value = '';
        inputField.disabled = true;
        sendButton.disabled = true;
        this.isWaitingForResponse = true;
        this.showTyping();

        try {
            const response = await this.callAPI();
            this.conversationHistory.push({ role: "assistant", content: response });
            this.hideTyping();
            this.showBotMsg(response);
        } catch (error) {
            this.hideTyping();
            this.showBotMsg(`Error: ${error.message}`);
            console.error('API Error:', error);
        } finally {
            inputField.disabled = false;
            inputField.focus();
            sendButton.disabled = false;
            this.isWaitingForResponse = false;
        }
    }

    showUserMsg(message) {
        this.addMessage('item right', 'fa-user', message);
    }

    showBotMsg(message) {
        this.addMessage('item', 'fa-robot', message);
    }

    addMessage(className, iconClass, message) {
        const { chatBox } = this.elements;

        const messageContainer = document.createElement('div');
        messageContainer.className = className;

        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon';
        const icon = document.createElement('i');
        icon.className = `fa ${iconClass}`;
        iconDiv.appendChild(icon);

        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        const paragraph = document.createElement('p');
        paragraph.textContent = message; // Safer than innerHTML
        msgDiv.appendChild(paragraph);

        messageContainer.appendChild(iconDiv);
        messageContainer.appendChild(msgDiv);
        chatBox.appendChild(messageContainer);

        const spacer = document.createElement('br');
        spacer.setAttribute('clear', 'both');
        chatBox.appendChild(spacer);
        this.scrollDown();
    }

    showTyping() {
        const { chatBox } = this.elements;

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'item typing-indicator';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon';
        const icon = document.createElement('i');
        icon.className = 'fa fa-robot';
        iconDiv.appendChild(icon);

        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        const paragraph = document.createElement('p');
        paragraph.textContent = 'Sedang mengetik...';
        msgDiv.appendChild(paragraph);

        typingIndicator.appendChild(iconDiv);
        typingIndicator.appendChild(msgDiv);
        chatBox.appendChild(typingIndicator);

        const spacer = document.createElement('br');
        spacer.setAttribute('clear', 'both');
        chatBox.appendChild(spacer);

        this.scrollDown();
    }

    hideTyping() {
        const { chatBox } = this.elements;
        const typing = chatBox.querySelector('.typing-indicator');

        if (typing) {
            const br = typing.nextElementSibling;
            if (br && br.tagName === 'BR') br.remove();
            typing.remove();
        }
    }

    async callAPI() {
        let messages = [...this.conversationHistory];
        const { maxHistoryLength } = this.config;

        // Keep system message and most recent messages
        if (messages.length > maxHistoryLength + 1) {
            messages = [
                messages[0], // System message
                ...messages.slice(-(maxHistoryLength))
            ];
        }
        const body = {
            model: this.config.model,
            messages: messages,
            temperature: this.config.temperature,
            stream: false,
            max_tokens: this.config.maxTokens
        };

        try {
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(this.getErrorMsg(response.status, errorData));
            }

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                return data.choices[0].message.content;
            } else {
                throw new Error('Respons tidak valid dari server');
            }
        } catch (error) {
            // Handle network errors specifically
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Koneksi gagal. Periksa koneksi internet Anda.');
            }
            throw error;
        }
    }

    clearChat() {
        if (this.isWaitingForResponse) {
            alert('Tunggu respon selesai sebelum menghapus percakapan');
            return;
        }

        if (confirm('Yakin mau hapus semua percakapan?')) {
            this.clearMessages();
            this.initConversation();
        }
    }

    getErrorMsg(status, errorData) {
        const errorMessages = {
            400: 'Format pesan tidak valid. Coba pesan yang lain.',
            401: 'API key tidak valid. Periksa kembali konfigurasi API key.',
            402: 'Saldo tidak mencukupi. Silakan isi ulang saldo.',
            403: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses API ini.',
            404: 'Endpoint API tidak ditemukan. Periksa URL API.',
            422: 'Parameter tidak valid. Coba pesan yang lain.',
            429: 'Terlalu banyak permintaan. Tunggu sebentar.',
            500: 'Terjadi kesalahan server. Coba lagi nanti.',
            503: 'Server sedang sibuk. Coba lagi nanti.'
        };

        // Check if we have a specific message for this status
        if (errorMessages[status]) {
            return errorMessages[status];
        }

        // If error data contains a message, use it
        if (errorData?.error?.message) {
            return `Error: ${errorData.error.message}`;
        }

        // Default error message
        return `Terjadi kesalahan (${status}). Coba lagi nanti.`;
    }

    scrollDown() {
        const { chatBox } = this.elements;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Initialize ChatBot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.chatBot = new ChatBot();
    } catch (error) {
        console.error('Failed to initialize ChatBot:', error);
        alert('Terjadi kesalahan saat menginisialisasi ChatBot. Silakan refresh halaman.');
    }
});
