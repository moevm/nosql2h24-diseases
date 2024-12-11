def create_relation_dict(r_from, r_to, r, r_type):
    new_dict = {}
    new_dict["type"] = r_type

    match r_type:
        case "Symptom-Disease":
            new_dict["relation_from"] = r_from["symptom_name"]
            new_dict["relation_to"] = r_to["disease_name"]
            new_dict["symptom_weight"] = r

        case "Appeal-Disease":
            new_dict["relation_from"] = r_from["appeal_date"]
            new_dict["relation_to"] = r_to["disease_name"]

        case "Symptom-Analysis":
            new_dict["relation_from"] = r_from["symptom_name"]
            new_dict["relation_to"] = r_to["analysis_name"]

        case "Patient-Appeal":
            new_dict["relation_from"] = r_from["mail"]
            new_dict["relation_to"] = r_to["appeal_date"]

        case "Appeal-Symptom":
            new_dict["relation_from"] = r_from["appeal_date"]
            new_dict["relation_to"] = r_to["symptom_name"]

    return new_dict 