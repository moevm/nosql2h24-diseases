FROM python:3.12.6

WORKDIR /backend

COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

ENV FLASK_APP=diseases.py

ENV FLASK_ENV=development

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0"]
