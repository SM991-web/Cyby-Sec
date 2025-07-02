const form = document.getElementById("chat-form") as HTMLFormElement;
const input = document.getElementById("question") as HTMLInputElement;
const output = document.getElementById("response") as HTMLDivElement;

form.onsubmit = async (e) => {
  e.preventDefault();

  const question = input.value;
  output.innerText = "Thinking...";

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    output.innerText = data.answer || "No answer received.";
  } catch (err) {
    output.innerText = "Error reaching the server.";
  }

  input.value = "";
};
