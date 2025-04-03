from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore
from vanna.flask import VannaFlaskApp

class MyVanna(ChromaDB_VectorStore, OpenAI_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        OpenAI_Chat.__init__(self, config=config)

vn = MyVanna(config={
    'api_key': '',
    'model': 'gpt-4o-mini'
})


vn.connect_to_mysql( # Slack Nosūtīti ja nepieciešams
    host='',
    dbname='',
    user='',
    password='',
    port=3306
)

    
df_info = vn.run_sql("SELECT * FROM INFORMATION_SCHEMA.COLUMNS")
plan = vn.get_training_plan_generic(df_info)
vn.train(plan=plan)

# Create the Flask app & run it
app = VannaFlaskApp(vn, allow_llm_to_see_data=True)

if __name__ == '__main__':
    # By default, app.run() will start on http://127.0.0.1:5001
    # or sometimes 127.0.0.1:8084. Adjust as needed:
    app.run(host='127.0.0.1', port=5001)
