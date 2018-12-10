FROM node:latest

# Provides cached layer for node_modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /src && cp -a /tmp/node_modules /src/

# Define working directory
WORKDIR /src
ADD . /src

ENV PORT 8080
ENV MONGODB=mongodb://localhost:27017/Cross

# Expose port
EXPOSE  8080

# Run app using nodemon
CMD ["node", "/src/server.js"]
