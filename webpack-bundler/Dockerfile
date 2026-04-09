# Use latest Node LTS
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files (webpack configuration)
COPY webpack.config.js .

CMD ["npm", "run", "dev"]