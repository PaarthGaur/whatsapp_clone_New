// const socket = io();

// // Join a default room or create dynamic rooms later
// socket.emit('join', { username: 'User1', room: 'general' });

// // Send messages
// document.getElementById('send-btn').addEventListener('click', () => {
//     const message = document.getElementById('message-input').value;
//     socket.emit('message', { room: 'general', content: message, type: 'text', sender: 'User1' });
// });

// // Receive messages
// socket.on('message', (data) => {
//     createMessage(data.content, data.type, data.sender === 'User1' ? false : true);
// });
// Connect to Socket.IO server
const socket = io('http://localhost:5000');

// Send message handler
function handleSendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText && currentChatId) {
        // Emit the message to the server
        socket.emit('send_message', {
            user_id: currentChatId,
            content: messageText,
            is_received: false
        });

        // Clear the input field
        messageInput.value = "";
        sendButton.disabled = true;
    }
}

// Listen for incoming messages
socket.on('receive_message', (data) => {
    if (data.user_id === currentChatId) {
        createMessage(data.content, 'text', data.is_received);
    }
});

// Fetch chat history when a chat is selected
function loadChatHistory(chatId) {
    fetch('/get_messages?user_id=${chatId}')
        .then(response => response.json())
        .then(messages => {
            clearChatBody();
            messages.forEach(msg => {
                createMessage(msg.content, 'text', msg.is_received, false);
            });
        });
}

document.addEventListener("DOMContentLoaded", function() {
    // Existing DOM elements
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.chat-header').prepend(menuToggle);
    
    const sidebar = document.querySelector('.sidebar');
    const searchInput = document.querySelector('#search-input');
    const chatList = document.querySelector('.chat-list');
    const originalChatItems = Array.from(chatList.children);

    // Menu toggle functionality
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // Clear current chat list
        chatList.innerHTML = '';
        
        // Filter and display matching chats
        originalChatItems.forEach(item => {
            const chatName = item.querySelector('h3').textContent.toLowerCase();
            const chatPreview = item.querySelector('.chat-preview').textContent.toLowerCase();
            
            if (chatName.includes(searchTerm) || chatPreview.includes(searchTerm)) {
                chatList.appendChild(item.cloneNode(true));
            }
        });
        
        // Reattach event listeners to new chat items
        attachChatItemListeners();
    });

    // Function to attach event listeners to chat items
    function attachChatItemListeners() {
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', function() {
                // Existing chat item click handler code...
                
                // Close sidebar on mobile after selecting a chat
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // Initial attachment of listeners
    attachChatItemListeners();

    // Window resize handler for responsive behavior
    let windowWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth !== windowWidth) {
            windowWidth = window.innerWidth;
            if (windowWidth > 768) {
                sidebar.classList.remove('active');
            }
        }
    });
});
document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    const sendButton = document.querySelector("#send-btn");
    const messageInput = document.querySelector("#message-input");
    const chatBody = document.querySelector("#chat-body");
    const fileButton = document.querySelector("#file-btn");
    const fileInput = document.querySelector("#file-input");
    const searchInput = document.querySelector("#search-input");
    const chatItems = document.querySelectorAll(".chat-item");
    const voiceButton = document.querySelector("#voice-btn");
    const chatContactInfo = document.querySelector(".chat-contact-info");

    // Store messages for each chat
    let currentChatId = null;
    const messageHistory = {};

    // Message status icons
    const messageStatuses = {
        sent: '<i class="fas fa-check"></i>',
        delivered: '<i class="fas fa-check-double"></i>',
        read: '<i class="fas fa-check-double" style="color: #00a884;"></i>'
    };

    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    function updateChatHeader(chatItem) {
        const name = chatItem.querySelector('h3').textContent;
        const avatar = chatItem.querySelector('img').src;
        chatContactInfo.innerHTML = `
            <img src="${avatar}" alt="Contact" class="chat-contact-avatar">
            <div class="contact-details">
                <h2>${name}</h2>
                <span class="online-status">online</span>
            </div>
        `;
    }

    function clearChatBody() {
        chatBody.innerHTML = '';
    }

    function loadChatHistory(chatId) {
        clearChatBody();
        if (messageHistory[chatId]) {
            messageHistory[chatId].forEach(msg => {
                createMessage(msg.content, msg.type, msg.isReceived, false);
            });
        }
    }

    function createMessage(content, type = 'text', isReceived = false, saveToHistory = true) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", isReceived ? "received" : "sent");
        let messageContent = '';
        if (type === 'text') {
            messageContent = `<div class="message-content">${content}</div>`;
        } else if (type === 'media') {
            const isImage = content.type.includes('image');
            const mediaElement = isImage ? 'img' : 'video';
            messageContent = `<${mediaElement} src="${URL.createObjectURL(content)}" ${!isImage ? 'controls' : ''} alt="Media content"></${mediaElement}>`;
        }

        messageDiv.innerHTML = `
            ${messageContent}
            <div class="message-meta">
                <span class="message-time">${getCurrentTime()}</span>
                ${!isReceived ? messageStatuses.sent : ''}
            </div>
        `;

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        if (saveToHistory && currentChatId) {
            if (!messageHistory[currentChatId]) {
                messageHistory[currentChatId] = [];
            }
            messageHistory[currentChatId].push({
                content,
                type,
                isReceived,
                timestamp: getCurrentTime()
            });
        }

        // Simulate message status updates
        if (!isReceived) {
            setTimeout(() => {
                const metaDiv = messageDiv.querySelector('.message-meta');
                if (metaDiv) {
                    metaDiv.innerHTML = `
                        <span class="message-time">${getCurrentTime()}</span>
                        ${messageStatuses.delivered}
                    `;
                }
            }, 1000);

            setTimeout(() => {
                const metaDiv = messageDiv.querySelector('.message-meta');
                if (metaDiv) {
                    metaDiv.innerHTML = `
                        <span class="message-time">${getCurrentTime()}</span>
                        ${messageStatuses.read}
                    `;
                }
            }, 2000);
        }

        return messageDiv;
    }

    // Send message handler
    function handleSendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText && currentChatId) {
            createMessage(messageText, 'text');
            messageInput.value = "";
            sendButton.disabled = true;

            // Simulate received message after a delay
            setTimeout(() => {
                const responses = [
                    "Thanks for your message!",
                    "I'll get back to you soon.",
                    "Got it, thanks!",
                    "Sounds good!",
                    "Perfect, will do!"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                createMessage(randomResponse, 'text', true);
            }, 2000);
        }
    }

    // Message input handler
    messageInput.addEventListener("input", function() {
        sendButton.disabled = !messageInput.value.trim();
    });

    // Send button click handler
    sendButton.addEventListener("click", handleSendMessage);

    // Enter key handler
    messageInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey && messageInput.value.trim()) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // File upload handler
    fileButton.addEventListener("click", function() {
        fileInput.click();
    });

    fileInput.addEventListener("change", function() {
        const file = fileInput.files[0];
        if (file && currentChatId) {
            createMessage(file, 'media');
            fileInput.value = ''; // Reset file input
        }
    });

    // Chat item click handler
    chatItems.forEach(item => {
        item.addEventListener("click", function() {
            const chatId = this.dataset.chatId;
            
            // Remove active class from all chat items
            chatItems.forEach(chat => chat.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update current chat ID
            currentChatId = chatId;
            
            // Update chat header
            updateChatHeader(this);
            
            // Load chat history
            loadChatHistory(chatId);
            
            // Remove unread badge
            const unreadBadge = this.querySelector('.unread-count');
            if (unreadBadge) {
                unreadBadge.style.display = 'none';
            }

            // Show chat container
            document.querySelector('.chat-container').style.display = 'flex';
        });
    });

    // Initialize message input state
    sendButton.disabled = true;

    // Set first chat as active by default
    if (chatItems.length > 0) {
        chatItems[0].click();
    }

    function createMessage(content, type = 'text', isReceived = false, saveToHistory = true) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", isReceived ? "received" : "sent");
        
        let messageContent = '';
        if (type === 'text') {
            messageContent = `
                <div class="message-content">${content}</div>
                <input type="text" class="edit-input" style="display: none;" value="${content}">
                <div class="edit-actions">
                    <button class="edit-btn">Save</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
                ${!isReceived ? `
                    <div class="message-actions">
                        <button class="message-action-btn edit-message">Edit</button>
                        <button class="message-action-btn delete-message">Delete</button>
                    </div>
                ` : ''}
            `;
        } else if (type === 'media') {
            const isImage = content.type.includes('image');
            const mediaElement = isImage ? 'img' : 'video';
            messageContent = `
                <${mediaElement} src="${URL.createObjectURL(content)}" ${!isImage ? 'controls' : ''} alt="Media content">
                ${!isReceived ? `
                    <div class="message-actions">
                        <button class="message-action-btn delete-message">Delete</button>
                    </div>
                ` : ''}
            `;
        }

        messageDiv.innerHTML = `
            ${messageContent}
            <div class="message-meta">
                <span class="message-time">${getCurrentTime()}</span>
                ${!isReceived ? messageStatuses.sent : ''}
            </div>
        `;

        // Add event listeners for edit and delete
        if (!isReceived) {
            const editBtn = messageDiv.querySelector('.edit-message');
            const deleteBtn = messageDiv.querySelector('.delete-message');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    enterEditMode(messageDiv);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteMessage(messageDiv);
                });
            }

            // Add event listeners for edit actions
            const saveEditBtn = messageDiv.querySelector('.edit-btn');
            const cancelEditBtn = messageDiv.querySelector('.cancel-btn');
            
            if (saveEditBtn) {
                saveEditBtn.addEventListener('click', () => {
                    saveEdit(messageDiv);
                });
            }
            
            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', () => {
                    cancelEdit(messageDiv);
                });
            }
        }

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        if (saveToHistory && currentChatId) {
            if (!messageHistory[currentChatId]) {
                messageHistory[currentChatId] = [];
            }
            messageHistory[currentChatId].push({
                content,
                type,
                isReceived,
                timestamp: getCurrentTime()
            });
        }

        // Simulate message status updates
        if (!isReceived) {
            updateMessageStatus(messageDiv);
        }

        return messageDiv;
    }

    function enterEditMode(messageDiv) {
        messageDiv.classList.add('edit-mode');
        const input = messageDiv.querySelector('.edit-input');
        const content = messageDiv.querySelector('.message-content');
        input.style.display = 'block';
        input.value = content.textContent;
        input.focus();
    }

    function saveEdit(messageDiv) {
        const input = messageDiv.querySelector('.edit-input');
        const content = messageDiv.querySelector('.message-content');
        content.textContent = input.value;
        
        // Update in message history
        if (currentChatId) {
            const messageIndex = Array.from(chatBody.children).indexOf(messageDiv);
            if (messageHistory[currentChatId] && messageHistory[currentChatId][messageIndex]) {
                messageHistory[currentChatId][messageIndex].content = input.value;
            }
        }
        
        exitEditMode(messageDiv);
    }

    function cancelEdit(messageDiv) {
        exitEditMode(messageDiv);
    }

    function exitEditMode(messageDiv) {
        messageDiv.classList.remove('edit-mode');
        const input = messageDiv.querySelector('.edit-input');
        input.style.display = 'none';
    }

    function deleteMessage(messageDiv) {
        if (confirm('Are you sure you want to delete this message?')) {
            // Remove from message history
            if (currentChatId) {
                const messageIndex = Array.from(chatBody.children).indexOf(messageDiv);
                if (messageHistory[currentChatId]) {
                    messageHistory[currentChatId].splice(messageIndex, 1);
                }
            }
            
            // Add deletion animation
            messageDiv.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }
    }

    function updateMessageStatus(messageDiv) {
        setTimeout(() => {
            const metaDiv = messageDiv.querySelector('.message-meta');
            if (metaDiv) {
                metaDiv.innerHTML = `
                    <span class="message-time">${getCurrentTime()}</span>
                    ${messageStatuses.delivered}
                `;
            }
        }, 1000);

        setTimeout(() => {
            const metaDiv = messageDiv.querySelector('.message-meta');
            if (metaDiv) {
                metaDiv.innerHTML = `
                    <span class="message-time">${getCurrentTime()}</span>
                    ${messageStatuses.read}
                `;
            }
        }, 2000);
    }
});

// Automatically hide flash messages after 2 seconds
const flashMessages = document.querySelectorAll('.flash');
flashMessages.forEach(message => {
    setTimeout(() => {
        message.style.display = 'none';
    }, 2000);  // 2 seconds
});