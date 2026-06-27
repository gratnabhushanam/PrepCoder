FROM node:18-bullseye

# Install Compilers (Java, GCC/G++, Python)
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    gcc \
    g++ \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD [ "node", "server.js" ]
