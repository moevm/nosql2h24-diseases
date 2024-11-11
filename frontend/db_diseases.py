from jinja2 import Environment, FileSystemLoader
env = Environment(loader=FileSystemLoader('templates'))
header_profile = env.get_template("header_profile.jinja")
header = env.get_template("header.jinja")
body = env.get_template("db_diseases.jinja")

header_output = header_profile.render(fullname = "Прошичев А.В.", is_profile = True, is_admin = False)
header_output = header.render(searching_button = True, user = header_output)
print(header_output)
with open("renders/db_diseases.html", 'w') as f:
   print(body.render(header = header_output), file = f)