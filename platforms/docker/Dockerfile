# Start from Ubuntu
FROM ubuntu
# Install dependencies (Node.js, npm, ripgrep, pandoc)
RUN apt-get update -y && \
    apt-get install -y \
    curl \
    git \
    ripgrep \
    pandoc \
    nodejs\
    npm
RUN npm install -g tiro-notes@develop
# Set working directory
WORKDIR /app

# Default command: Start http-server on port 8080
# CMD ["ls"]
# CMD ["echo", "helloworld", ">", "test"]
# CMD ["tiro-notes"]
# CMD ["npx", "http-server", "-p", "8080", "--host", "0.0.0.0"]
CMD ["npx", "tiro-notes@develop"]