const form = document.getElementById("chatForm") as HTMLFormElement;
const input = document.getElementById("message") as HTMLInputElement;
const output = document.getElementById("response") as HTMLDivElement;
const sourceCheck = document.getElementById("sourceCheck") as HTMLInputElement;

form.onsubmit = async (e) => {
  e.preventDefault();

  const message = input.value;
  const showSources = sourceCheck.checked;
  output.innerText = "Thinking...";

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, showSources })
    });

    const data = await res.json();  
    output.innerText = data.response || "No response.";
  } catch (err) {
    output.innerText = "Error reaching the server.";
  }

  input.value = "";
};
