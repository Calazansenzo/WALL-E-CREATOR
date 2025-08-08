from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import mysql.connector
from mysql.connector import errorcode

app = Flask(__name__)
CORS(app)  # Permitir CORS para todas as rotas

# --- CONFIGURAÇÃO DO BANCO DE DADOS MYSQL ---
# !!! ATENÇÃO: Preencha com os dados do seu servidor MySQL !!!
MYSQL_CONFIG = {
    'user': 'root',        # Ex: 'root'
    'password': '',      # Ex: '123456'
    'host': 'localhost',          # Ou o IP do seu servidor de banco de dados
    'database': 'database_db',    # O nome do banco de dados que será usado
}


def get_db_connection():
    """Cria uma conexão com o banco de dados MySQL."""
    try:
        connection = mysql.connector.connect(**MYSQL_CONFIG)
        return connection
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Erro de acesso: verifique seu usuário e senha.")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print(f"O banco de dados '{MYSQL_CONFIG['database']}' não existe.")
        else:
            print(f"Erro ao conectar ao MySQL: {err}")
        return None

def init_database():
    """Inicializa o banco de dados e as tabelas no MySQL, se não existirem."""
    try:
        temp_config = MYSQL_CONFIG.copy()
        db_name = temp_config.pop('database')
        
        connection = mysql.connector.connect(**temp_config)
        cursor = connection.cursor()
        
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} DEFAULT CHARACTER SET 'utf8mb4'")
        cursor.execute(f"USE {db_name}")
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projetos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT,
                tinkercad_link TEXT,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS componentes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                projeto_id INT NOT NULL,
                nome VARCHAR(255) NOT NULL,
                quantidade INT NOT NULL DEFAULT 0,
                FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
            )
        """)
        
        connection.commit()
        print("Banco de dados e tabelas do MySQL inicializados com sucesso!")
        
    except mysql.connector.Error as err:
        print(f"Erro ao inicializar banco de dados: {err}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

# --- Rotas para páginas HTML ---

@app.route('/')
def index():
    """Página principal - lista de projetos"""
    return render_template('index.html')

@app.route('/add')
def add_project():
    """Página para adicionar novo projeto"""
    return render_template('add.html')

@app.route('/project/<int:project_id>')
def view_project(project_id):
    """Página para visualizar um projeto específico"""
    return render_template('view.html', project_id=project_id)

# --- Rotas da API (Adaptadas para MySQL) ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'API de Projetos (MySQL) está funcionando',
        'version': '1.0.0'
    })

@app.route('/api/projetos', methods=['GET'])
def listar_projetos():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Erro de conexão com o banco de dados'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM projetos ORDER BY data_criacao DESC")
        projetos = cursor.fetchall()
        
        for projeto in projetos:
            cursor.execute("SELECT * FROM componentes WHERE projeto_id = %s", (projeto['id'],))
            projeto['componentes'] = cursor.fetchall()
        
        return jsonify(projetos)
    
    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar projetos: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/projetos', methods=['POST'])
def criar_projeto():
    data = request.get_json()
    if not data or 'nome' not in data:
        return jsonify({'error': 'O nome do projeto é obrigatório'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Erro de conexão com o banco de dados'}), 500
    
    try:
        cursor = connection.cursor()
        
        query_projeto = "INSERT INTO projetos (nome, descricao, tinkercad_link) VALUES (%s, %s, %s)"
        cursor.execute(query_projeto, (
            data['nome'], 
            data.get('descricao', ''),
            data.get('tinkercad_link', '')
        ))
        projeto_id = cursor.lastrowid
        
        if 'componentes' in data and isinstance(data['componentes'], list):
            componentes_para_inserir = []
            for comp in data['componentes']:
                if comp.get('nome') and comp.get('quantidade') is not None:
                    componentes_para_inserir.append(
                        (projeto_id, comp['nome'], int(comp['quantidade']))
                    )
            
            if componentes_para_inserir:
                query_componentes = "INSERT INTO componentes (projeto_id, nome, quantidade) VALUES (%s, %s, %s)"
                cursor.executemany(query_componentes, componentes_para_inserir)
        
        connection.commit()
        
        return jsonify({
            'id': projeto_id,
            'nome': data['nome'],
            'descricao': data.get('descricao', ''),
            'tinkercad_link': data.get('tinkercad_link', ''),
            'message': 'Projeto criado com sucesso!'
        }), 201
    
    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify({'error': f'Erro ao criar projeto: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/projetos/<int:projeto_id>', methods=['GET'])
def obter_projeto(projeto_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Erro de conexão com o banco de dados'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM projetos WHERE id = %s", (projeto_id,))
        projeto = cursor.fetchone()
        
        if not projeto:
            return jsonify({'error': 'Projeto não encontrado'}), 404
        
        cursor.execute("SELECT * FROM componentes WHERE projeto_id = %s", (projeto_id,))
        projeto['componentes'] = cursor.fetchall()
        
        return jsonify(projeto)
    
    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar projeto: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/projetos/<int:projeto_id>', methods=['PUT'])
def atualizar_projeto(projeto_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dados não fornecidos para atualização'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Erro de conexão com o banco de dados'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Atualiza os campos do projeto se eles foram fornecidos
        update_fields = []
        update_values = []
        
        if 'nome' in data:
            update_fields.append("nome = %s")
            update_values.append(data['nome'])
        if 'descricao' in data:
            update_fields.append("descricao = %s")
            update_values.append(data['descricao'])
        if 'tinkercad_link' in data:
            update_fields.append("tinkercad_link = %s")
            update_values.append(data['tinkercad_link'])
        
        if update_fields:
            update_values.append(projeto_id)
            query = f"UPDATE projetos SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, tuple(update_values))

        # Atualiza os componentes: a abordagem mais simples é deletar os antigos e inserir os novos
        if 'componentes' in data and isinstance(data['componentes'], list):
            cursor.execute("DELETE FROM componentes WHERE projeto_id = %s", (projeto_id,))
            
            componentes_para_inserir = []
            for comp in data['componentes']:
                if comp.get('nome') and comp.get('quantidade') is not None:
                    componentes_para_inserir.append(
                        (projeto_id, comp['nome'], int(comp['quantidade']))
                    )
            
            if componentes_para_inserir:
                query_componentes = "INSERT INTO componentes (projeto_id, nome, quantidade) VALUES (%s, %s, %s)"
                cursor.executemany(query_componentes, componentes_para_inserir)
        
        connection.commit()
        
        return jsonify({'message': 'Projeto atualizado com sucesso!'})
    
    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify({'error': f'Erro ao atualizar projeto: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/projetos/<int:projeto_id>', methods=['DELETE'])
def deletar_projeto(projeto_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Erro de conexão com o banco de dados'}), 500
    
    try:
        cursor = connection.cursor()
        
        # A chave estrangeira com 'ON DELETE CASCADE' garante que os componentes serão deletados junto
        cursor.execute("DELETE FROM projetos WHERE id = %s", (projeto_id,))
        
        # 'rowcount' verifica se alguma linha foi afetada (deletada)
        if cursor.rowcount == 0:
            return jsonify({'error': 'Projeto não encontrado'}), 404
            
        connection.commit()
        
        return jsonify({'message': 'Projeto deletado com sucesso!'})
    
    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify({'error': f'Erro ao deletar projeto: {err}'}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    # Inicializa o banco de dados e as tabelas na primeira execução
    init_database()
    
    # Executa a aplicação Flask
    app.run(host='0.0.0.0', port=5000, debug=True)

