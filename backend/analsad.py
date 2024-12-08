import csv

# Функция для чтения CSV-файла и обработки данных
def process_csv(file_path1, file_path2):
    symptoms_weight = {}

    with open(file_path1, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file, delimiter=',')
        for row in csv_reader:
            symptom = row[0]
            weight = row[1]
            symptoms_weight[symptom] = weight

    with open(file_path2, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file, delimiter=',')
        for row in csv_reader:
            disease = row[0]
            print(symptoms_weight[disease])

# Путь к вашему CSV-файлу
file_path1 = '/home/azazzzel/Загрузки/dataset/Symptom-severity_ru.csv'
file_path2 = '/home/azazzzel/Загрузки/dataset/test.csv'

# Вызов функции для обработки файла
process_csv(file_path1, file_path2)