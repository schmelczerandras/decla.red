ARG VARIANT="14-buster"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

RUN apt update && export DEBIAN_FRONTEND=noninteractive \
     && apt -y install --no-install-recommends git-lfs  \
     && rm -rf /var/lib/apt/lists/*

RUN git lfs install

RUN npm i && npm run init

ENV ZSH_CUSTOM /root/.oh-my-zsh/
RUN git clone https://github.com/reobin/typewritten.git $ZSH_CUSTOM/themes/typewritten
RUN ln -s "$ZSH_CUSTOM/themes/typewritten/typewritten.zsh-theme" "$ZSH_CUSTOM/themes/typewritten.zsh-theme"
RUN ln -s "$ZSH_CUSTOM/themes/typewritten/async.zsh" "$ZSH_CUSTOM/themes/async"
COPY .zshrc /root/.zshrc
