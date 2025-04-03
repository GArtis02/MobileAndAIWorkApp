import tkinter as tk
from tkinter import messagebox
import requests
from bs4 import BeautifulSoup
import re
import mysql.connector

# === Full category map from Visidarbi.lv ===
CATEGORIES = {
    "Pārdošana, Tirdzniecība, Klientu apkalpošana": 14,
    "Ražošana, Rūpniecība": 16,
    "Būvniecība, Nekustamais īpašums, Ceļu būve": 4,
    "Veselības aprūpe, Farmācija": 21,
    "Pakalpojumi": 13,
    "Izglītība, Zinātne": 7,
    "Informāciju tehnoloģijas, Datori": 6,
    "Transports, Loģistika, Piegāde": 17,
    "Administrēšana, Asistēšana": 1,
    "Vadība": 19,
    "Inženiertehnika": 23,
    "Tūrisms, Viesnīcas, Ēdināšana": 18,
    "Bankas, Apdrošināšana, Finanses, Grāmatvedība": 3,
    "Valsts un pašvaldību pārvalde": 20,
    "Elektronika, Telekomunikācijas, Enerģētika": 5,
    "Prakse, Brīvprātīgais darbs": 22,
    "Mārketings, Reklāma, PR, Mediji": 12,
    "Lauksaimniecība, Mežsaimniecība, Vide": 10,
    "Personāla vadība": 15,
    "Jurisprudence, Tieslietas": 8,
    "Apsardze, Drošība": 2,
    "Kultūra, Māksla, Izklaide": 9,
    "Mājsaimniecība, Apkope": 11
}

# === Salary logic ===
def smart_salary_type(salary_min, salary_max, raw_text):
    raw = raw_text.lower()
    if any(k in raw for k in ['hour', '/h', '€/h', 'per hour', '/st.', 'stundā', 'st.', 'h']):
        return 'hourly'
    if salary_max >= 500:
        return 'monthly'
    if salary_max <= 30:
        return 'hourly'
    return 'monthly'

def extract_salary(text):
    numbers = re.findall(r'\d+(?:[.,]\d+)?', text.replace(',', '.'))
    if len(numbers) == 1:
        return float(numbers[0]), float(numbers[0])
    elif len(numbers) >= 2:
        return float(numbers[0]), float(numbers[1])
    return None, None

def scrape_category(category_name, category_id, pages, cursor, db):
    for page in range(1, pages + 1):
        url = f"https://www.visidarbi.lv/darba-sludinajumi?sort=date_from&categories={category_id}&salaryFilters=id%3A2%2Cid%3A3%2Cid%3A4%2Cid%3A5&page={page}#results"
        headers = {'User-Agent': 'Mozilla/5.0'}
        soup = BeautifulSoup(requests.get(url, headers=headers).text, 'html.parser')

        for item in soup.select('div.item.premium.big-item'):
            title_tag = item.select_one('a.long-title')
            if not title_tag:
                continue

            title = title_tag.text.strip()
            job_url = "https://www.visidarbi.lv" + title_tag['href']
            location = item.select_one('li.location span')
            company = item.select_one('li.company span')
            salary_text = item.select_one('li.salary span')
            deadline = item.select_one('li.duedate span')

            location = location.text.strip() if location else ''
            company = company.text.strip() if company else ''
            salary_text = salary_text.text.strip() if salary_text else ''
            deadline = deadline.text.strip() if deadline else ''

            salary_min, salary_max = extract_salary(salary_text)
            if salary_min is None:
                continue

            salary_type = smart_salary_type(salary_min, salary_max, salary_text)

            if salary_type == 'hourly':
                hourly_equiv_min = salary_min
                hourly_equiv_max = salary_max
                monthly_equiv_min = round(salary_min * 160, 2)
                monthly_equiv_max = round(salary_max * 160, 2)
            else:
                hourly_equiv_min = round(salary_min / 160, 2)
                hourly_equiv_max = round(salary_max / 160, 2)
                monthly_equiv_min = salary_min
                monthly_equiv_max = salary_max

            sql = '''
                INSERT INTO jobs (
                    title, company, location, salary_type,
                    salary_min, salary_max,
                    hourly_equiv_min, hourly_equiv_max,
                    monthly_equiv_min, monthly_equiv_max,
                    calculated, url, deadline, category
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            '''
            values = (
                title, company, location, salary_type,
                salary_min, salary_max,
                hourly_equiv_min, hourly_equiv_max,
                monthly_equiv_min, monthly_equiv_max,
                False, job_url, deadline, category_name
            )
            cursor.execute(sql, values)
        db.commit()

def start_scraping():
    try:
        host = host_entry.get()
        user = user_entry.get()
        password = password_entry.get()
        database = db_entry.get()
        pages = int(page_entry.get())

        db = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        cursor = db.cursor()

        # Loop through every category automatically
        for category_name, category_id in CATEGORIES.items():
            status_label.config(text=f"Scraping {category_name} ({pages} pages)...")
            root.update()
            scrape_category(category_name, category_id, pages, cursor, db)
        status_label.config(text="✅ Done! Data saved.")
        messagebox.showinfo("Success", f"Scraped {pages} page(s) from all categories.")

    except Exception as e:
        messagebox.showerror("Error", str(e))

# === GUI Setup ===
root = tk.Tk()
root.title("VisiDarbi.lv Full Category Scraper")

fields = [
    ("MySQL Host", "localhost"),
    ("MySQL User", "root"),
    ("MySQL Password", ""),
    ("Database Name", "Vakances"),
    ("Pages to Scrape", "2")
]

entries = []

for label_text, default in fields:
    frame = tk.Frame(root)
    frame.pack(padx=10, pady=5, fill="x")
    label = tk.Label(frame, text=label_text, width=20, anchor='w')
    label.pack(side="left")
    entry = tk.Entry(frame, show="*" if "Password" in label_text else None)
    entry.insert(0, default)
    entry.pack(side="right", expand=True, fill="x")
    entries.append(entry)

host_entry, user_entry, password_entry, db_entry, page_entry = entries

start_btn = tk.Button(root, text="Start Scraping", command=start_scraping)
start_btn.pack(pady=10)

status_label = tk.Label(root, text="", fg="blue")
status_label.pack()

root.mainloop()
