// Replace 'sk-xxxxx' with your actual API key
const apiKey = "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";

document.getElementById("send-button").addEventListener("click", async () => {
    const userInput = document.getElementById("user-input").value.trim();
    if (userInput === "") return;

    // Display the user's message
    appendMessage("You", userInput);
    document.getElementById("user-input").value = "";

    try {
        // Call OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4", // You can change to "gpt-3.5-turbo" if you prefer
                messages: [
                    { role: "system", content: "You are a helpful chatbot." },
                    { role: "user", content: userInput }
                ],
                max_tokens: 100
            })
        });

        const data = await response.json();
        if (response.ok) {
            const botReply = data.choices[0].message.content.trim();
            appendMessage("Chatbot", botReply);
        } else {
            appendMessage("Chatbot", "Sorry, I couldn't process your request.");
            console.error(data);
        }
    } catch (error) {
        appendMessage("Chatbot", "An error occurred. Please try again.");
        console.error(error);
    }
});

function appendMessage(sender, message) {
    const messageContainer = document.getElementById("messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll
}
