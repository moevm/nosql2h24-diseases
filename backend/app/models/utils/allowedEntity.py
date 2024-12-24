allowed_entity_parameters = {
    "Patient": [
        "fullname",
        "mail",
        "password",
        "sex",
        "birthday",
        "last_update",
        "registration_date",
        "height",
        "weight",
        "admin"
    ],
    "Appeal": [
        "appeal_date",
        "appeal_complaints"
    ],
    "Symptom": [
        "symptom_name",
        "symptom_description"
    ],
    "Disease": [
        "disease_name",
        "disease_description",
        "disease_recommendations",
        "disease_type",
        "disease_course"
    ],
    "Analysis": [
        "analysis_name",
        "analysis_source"
    ]
}

allowed_relations = ['Symptom-Disease', 'Appeal-Disease', 'Symptom-Analysis', 'Patient-Appeal', 'Appeal-Symptom']

CSV_columns = [
    "type",
    "fullname",
    "mail",
    "password",
    "sex",
    "age",
    "height",
    "weight",
    "admin",
    "birthday",
    "last_update",
    "registration_date",
    "disease_name",
    "disease_description",
    "disease_recommendations",
    "disease_type",
    "disease_course",
    "symptom_name",
    "symptom_description",
    "analysis_name",
    "analysis_source",
    "relation_from",
    "relation_to",
    "symptom_weight",
    "appeal_date",
    "appeal_complaints"
]