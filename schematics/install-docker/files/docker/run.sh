for file in /usr/share/nginx/html/*.js;
do
    echo $file;
    envsubst '\$ISSUER_URL \
    \$BASE_URL \
    \$ENVIRONMENT_NAME \
    ' < ${file} > ${file}.tmp && mv ${file}.tmp ${file};
done

nginx -g 'daemon off;'
