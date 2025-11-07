FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install 

COPY . . 

RUN npm run build

# --- stage 2: serve with nginx ---
FROM nginx
# remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# copy build output (adjust path if your tool outputs to /dist or /build)
COPY --from=build /app/build /usr/share/nginx/html

# optional: adjust permissions (not usually required)
RUN chown -R nginx:nginx /usr/share/nginx/html

# expose port and start nginx (default CMD in base image is fine)
EXPOSE 7777

CMD ["nginx", "-g", "daemon off;"]