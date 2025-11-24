# Use the official Ubuntu 22.04 LTS image as a parent image
FROM ubuntu:22.04

# Set environment variables to prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Update the package list and install necessary dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    git-all \
    apt-transport-https \
    ca-certificates \
    python3 \
    python3-pip \
    iputils-ping \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js v18.x LTS and NestJS CLI
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash
RUN apt-get install -y nodejs
RUN npm install -g @nestjs/cli

# Install the Google Cloud CLI
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
    apt-get update -y && \
    apt-get install -y google-cloud-cli

# Bash customizations...
RUN apt-get update && apt-get install -y bash-completion && \
    { \
        echo; \
        echo '# --- Enable Bash Completion ---'; \
        echo 'if [ -f /etc/bash_completion ]; then . /etc/bash_completion; fi'; \
        echo; \
        echo '# --- Git Prompt Customization ---'; \
        echo 'if [ -f /usr/lib/git-core/git-sh-prompt ]; then'; \
        echo '  source /usr/lib/git-core/git-sh-prompt'; \
        echo '  GIT_PS1_SHOWDIRTYSTATE=true'; \
        echo '  GIT_PS1_SHOWUNTRACKEDFILES=true'; \
        echo '  PS1='\''\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]$(__git_ps1 " \[\033[01;33m\](%s)\[\033[00m\]")\$ '\'''; \
        echo 'fi'; \
    } >> /root/.bashrc

# Set the working directory
WORKDIR /app

# Copy and install Python requirements
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Verify the installations
RUN python3 --version && \
    pip3 --version && \
    gcloud --version && \
    node --version && \
    npm --version && \
    nest --version && \
    psql --version

# Create a symbolic link for 'python'
RUN ln -s /usr/bin/python3 /usr/bin/python

# install gemini-cli
RUN npm install -g @google/gemini-cli

#setup git 
RUN git config --global user.email "ayan_mitra@outlook.com"
RUN git config --global user.name "Ayan"  

# Keep the container running
CMD ["tail", "-f", "/dev/null"]