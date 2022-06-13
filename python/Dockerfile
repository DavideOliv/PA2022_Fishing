FROM python:alpine3.8
WORKDIR /app
COPY . .
RUN pip install -r ./requirements.txt
EXPOSE 5001 
ENTRYPOINT [ "python", "service.py" ] 