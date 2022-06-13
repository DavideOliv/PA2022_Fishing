FROM python:alpine3.8
WORKDIR /app
COPY . .
RUN pip install -r ./requirements.txt
EXPOSE 5001 
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENTRYPOINT [ "python", "app.py" ] 