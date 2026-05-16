FROM nginx:alpine

# The Frontend is served natively by FastAPI natively now without node, but if separated:
COPY . /usr/share/nginx/html

EXPOSE 80
