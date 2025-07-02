from flask import Flask, request, jsonify, render_template
import requests
from config import GITHUB_TOKEN

app = Flask(__name__)

headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json"
}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message").lower()

    if "repos" in user_input or "repositories" in user_input or "projects" in user_input:
        return get_repos("octocat")  # change "octocat" to your username
    elif "repo details" in user_input:
        try:
            repo_name = user_input.split("repo details",1)[1].strip()
            return get_repo_details("octocat", repo_name)
        except:
            return jsonify({"response": "Please specify the repo name after 'repo details'"})

    else:
        return jsonify({"response": "Sorry, I didn’t understand that."})


def get_repos(username):
    url = f"https://api.github.com/users/{username}/repos"
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        names = [repo["name"] for repo in r.json()]
        return jsonify({"response": ", ".join(names)})
    return jsonify({"response": "Failed to fetch repos."})

def get_repo_details(username, repo):
    url = f"https://api.github.com/repos/{username}/{repo}"
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        data = r.json()
        return jsonify({"response": f"{data['name']} - ⭐ {data['stargazers_count']}"})
    return jsonify({"response": "Repo not found."})

if __name__ == "__main__":
    app.run(debug=True)
