import os
import requests
def send_simple_message():
  	return requests.post(
  		"https://api.mailgun.net/v3/sandbox1d263fa45cbd47509243fb3f310b1518.mailgun.org/messages",
  		auth=("api", os.getenv('MAILGUN_API_KEY', 'MAILGUN_API_KEY')),
  		data={"from": "Mailgun Sandbox <postmaster@sandbox1d263fa45cbd47509243fb3f310b1518.mailgun.org>",
			"to": "Anna Pokrovskaya <anna.pokrovskaya@gmail.com>",
  			"subject": "Hello Anna Pokrovskaya",
  			"text": "Congratulations Anna Pokrovskaya, you just sent an email with Mailgun! You are truly awesome!"})