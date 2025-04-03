from flask import Flask, request, jsonify, Response
import json
import pandas as pd
import concurrent.futures
from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore


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

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'error': 'No message provided'}), 400

    try:
       
        msg_lower = message.lower()
        contains_job = any(keyword in msg_lower for keyword in ["job", "vacancy", "listing"])
        contains_graph = any(keyword in msg_lower for keyword in ["graph", "chart", "plot"])
        if contains_job and contains_graph:
            response_type = "combined"
        elif contains_job:
            response_type = "job"
        elif contains_graph:
            response_type = "graph"
        else:
            response_type = "text"

       
        sql_query = vn.generate_sql(question=message, allow_llm_to_see_data=True)
        print("Generated SQL Query:", sql_query)

        
        try:
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(vn.run_sql, sql_query)
                df = future.result(timeout=20) 
        except concurrent.futures.TimeoutError:
            return jsonify({'error': 'Database query timed out'}), 504

        records = df.to_dict(orient='records') if df is not None else []

        
        reply_data = {
            "responseType": response_type,
            "sqlQuery": sql_query
        }

       
        if response_type in ["graph", "combined"]:
            try:
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        vn.generate_plotly_code,
                        question=message,
                        sql=sql_query,
                        df_metadata=f"{df.dtypes}" if df is not None else "No data"
                    )
                    plotly_code = future.result(timeout=10)  
                fig = vn.get_plotly_figure(plotly_code=plotly_code, df=df, dark_mode=False)
                graph_json = fig.to_json()
                reply_data["graph"] = graph_json
            except concurrent.futures.TimeoutError:
                print("Graph generation timed out")
                reply_data["graph"] = None
            except Exception as graph_error:
                print("Graph generation error:", graph_error)
                reply_data["graph"] = None

        
        if response_type in ["text", "job", "combined"]:
            reply_data["reply"] = records

        response_data = json.dumps(reply_data, default=str, indent=2)
        return Response(response=response_data, status=200, mimetype='application/json')

    except Exception as e:
        print("Error processing /chat request:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train():
    data = request.get_json()
    training_type = data.get('type')
    content = data.get('content')
    if not training_type or not content:
        return jsonify({'error': 'Training type or content not provided'}), 400

    try:
        if training_type == 'ddl':
            vn.train(ddl=content)
        elif training_type == 'documentation':
            vn.train(documentation=content)
        elif training_type == 'sql':
            vn.train(sql=content)
        else:
            return jsonify({'error': 'Unknown training type'}), 400

        return jsonify({'message': 'Training data added successfully'})
    except Exception as e:
        print("Error processing /train request:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
