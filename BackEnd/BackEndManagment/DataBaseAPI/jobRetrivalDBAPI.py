import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql


logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)  


db_config = {
    'host': '',
    'user': '',
    'password': '',
    'database': ''
}

def get_db_connection(): # Slack Nosūtīti ja nepieciešams
    connection = pymysql.connect(
        host=db_config['host'],
        user=db_config['user'],
        password=db_config['password'],
        database=db_config['database'],
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection


@app.route('/filter-options', methods=['GET'])
def get_filter_options():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT DISTINCT location FROM jobs")
            locations = [row['location'] for row in cursor.fetchall()]
            cursor.execute("SELECT DISTINCT category FROM jobs")
            categories = [row['category'] for row in cursor.fetchall()]
            return jsonify({'locations': locations, 'categories': categories})
    except Exception as e:
        logging.error("Error fetching filter options: %s", e)
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/all-jobs', methods=['GET'])
def get_all_jobs():
    categories_param = request.args.get('categories', '')
    locations_param = request.args.get('location', '')
    pay_from = request.args.get('payFrom', type=float)
    pay_to = request.args.get('payTo', type=float)
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)
    offset = (page - 1) * limit

    
    categories = [cat.strip() for cat in categories_param.split(',') if cat.strip()]
    locations = [loc.strip() for loc in locations_param.split(',') if loc.strip()]

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            conditions = []
            params = []

           
            if categories:
                category_clauses = ["category LIKE CONCAT('%%', %s, '%%')" for _ in categories]
                conditions.append("(" + " OR ".join(category_clauses) + ")")
                params.extend(categories)

            
            if locations:
                location_clauses = ["location LIKE CONCAT('%%', %s, '%%')" for _ in locations]
                conditions.append("(" + " OR ".join(location_clauses) + ")")
                params.extend(locations)

            
            if pay_from is not None:
                conditions.append("salary_min >= %s")
                params.append(pay_from)
            if pay_to is not None:
                conditions.append("salary_max <= %s")
                params.append(pay_to)

            
            where_clause = " AND ".join(conditions) if conditions else "1"
            logging.info("WHERE clause: %s", where_clause.replace('%', '%%'))
            logging.info("Query params: %s", params)

            
            query = f"SELECT * FROM jobs WHERE {where_clause} ORDER BY id DESC LIMIT %s OFFSET %s"
            params_with_limit = params + [limit, offset]
            cursor.execute(query, tuple(params_with_limit))
            jobs = cursor.fetchall()

            
            count_query = f"SELECT COUNT(*) AS total FROM jobs WHERE {where_clause}"
            cursor.execute(count_query, tuple(params))
            total = cursor.fetchone()['total']

            return jsonify({
                'jobs': jobs,
                'total': total,
                'page': page,
                'limit': limit,
                'pages': (total + limit - 1) // limit
            })

    except Exception as e:
        logging.error("Error fetching all jobs: %s", e)
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/filter-counts', methods=['GET'])
def get_filter_counts():
    
    categories_param = request.args.get('categories', '')
    locations_param = request.args.get('location', '')
    pay_from = request.args.get('payFrom', type=float)
    pay_to = request.args.get('payTo', type=float)

    
    selected_categories = [cat.strip() for cat in categories_param.split(',') if cat.strip()]
    selected_locations = [loc.strip() for loc in locations_param.split(',') if loc.strip()]

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            
            conditions = []
            params = []
            if selected_locations:
                location_clauses = ["location LIKE CONCAT('%%', %s, '%%')" for _ in selected_locations]
                conditions.append("(" + " OR ".join(location_clauses) + ")")
                params.extend(selected_locations)
            if pay_from is not None:
                conditions.append("salary_min >= %s")
                params.append(pay_from)
            if pay_to is not None:
                conditions.append("salary_max <= %s")
                params.append(pay_to)
            where_clause = " AND ".join(conditions) if conditions else "1"
            category_query = f"SELECT category, COUNT(*) as count FROM jobs WHERE {where_clause} GROUP BY category"
            cursor.execute(category_query, tuple(params))
            category_counts = cursor.fetchall()

            
            conditions = []
            params = []
            if selected_categories:
                category_clauses = ["category LIKE CONCAT('%%', %s, '%%')" for _ in selected_categories]
                conditions.append("(" + " OR ".join(category_clauses) + ")")
                params.extend(selected_categories)
            if pay_from is not None:
                conditions.append("salary_min >= %s")
                params.append(pay_from)
            if pay_to is not None:
                conditions.append("salary_max <= %s")
                params.append(pay_to)
            where_clause = " AND ".join(conditions) if conditions else "1"
            location_query = f"SELECT location, COUNT(*) as count FROM jobs WHERE {where_clause} GROUP BY location"
            cursor.execute(location_query, tuple(params))
            location_counts = cursor.fetchall()

            return jsonify({
                'categoryCounts': category_counts,
                'locationCounts': location_counts
            })
    except Exception as e:
        logging.error("Error fetching filter counts: %s", e)
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/jobs', methods=['GET'])
def get_jobs():
    categories_param = request.args.get('categories', '')
    location = request.args.get('location', '').strip()
    categories = [cat.strip() for cat in categories_param.split(',') if cat.strip()]
    logging.info("Received categories: %s", categories)
    logging.info("Received location: %s", location)

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            
            recommended = []
            if categories and location:
                conditions = []
                params = []
                for cat in categories:
                    conditions.append("category LIKE CONCAT('%%', %s, '%%')")
                    params.append(cat)
                category_condition = "(" + " OR ".join(conditions) + ")"
                query = f"SELECT * FROM jobs WHERE {category_condition} AND location = %s ORDER BY id DESC LIMIT 5"
                all_params = params + [location]
                logging.info("Query with both category and location: %s", query)
                logging.info("Params: %s", all_params)
                cursor.execute(query, tuple(all_params))
                recommended = cursor.fetchall()
                if not recommended:
                    logging.info("No results with both filters; trying category only.")
                    query = f"SELECT * FROM jobs WHERE {category_condition} ORDER BY id DESC LIMIT 5"
                    cursor.execute(query, tuple(params))
                    recommended = cursor.fetchall()
            elif categories:
                conditions = []
                params = []
                for cat in categories:
                    conditions.append("category LIKE CONCAT('%%', %s, '%%')")
                    params.append(cat)
                category_condition = "(" + " OR ".join(conditions) + ")"
                query = f"SELECT * FROM jobs WHERE {category_condition} ORDER BY id DESC LIMIT 5"
                cursor.execute(query, tuple(params))
                recommended = cursor.fetchall()

           
            if not recommended:
                cursor.execute("SELECT * FROM jobs ORDER BY id DESC LIMIT 5")
                recommended = cursor.fetchall()

           
            cursor.execute("SELECT * FROM jobs ORDER BY id DESC LIMIT 5")
            newest = cursor.fetchall()

           
            local_jobs = []
            if location:
                cursor.execute("SELECT * FROM jobs WHERE location = %s ORDER BY id DESC LIMIT 5", (location,))
                local_jobs = cursor.fetchall()

            return jsonify({
                'recommended': recommended,
                'newest': newest,
                'local': local_jobs,
            })

    except Exception as e:
        logging.error("Error fetching jobs: %s", e)
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/monthly_jobs', methods=['GET'])
def get_monthly_jobs():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM monthly_jobs")
            rows = cursor.fetchall()
            return jsonify(rows)
    except Exception as e:
        logging.error("Error fetching monthly jobs: %s", e)
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/hourly_jobs', methods=['GET'])
def get_hourly_jobs():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM hourly_jobs")
            rows = cursor.fetchall()
            return jsonify(rows)
    except Exception as e:
        logging.error("Error fetching hourly jobs: %s", e)
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
