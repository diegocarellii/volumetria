from app import app
from bibliotecas_servidor import *
from server_conection import *
from bibliotecas import *


#=============================GLOBAL USO============================

biscoito = "PHPSESSID=j4rf6hfo7tubpm20kc78k0pq73"

#===================================================================

@app.route('/volumetria_dist_operadores')
def volumetria_dist_operadores():
    return render_template('volumetria_dist_operadores.html')

@app.route('/dime_volume_mensal')
def dime_volume_mensal():
    return render_template('dime_volume_mensal.html')

# Função para obter os dados do banco de dados
def get_data(interval):
    conn = connect_db("SADIG_DB")
    query = """
        SELECT cra.*,
            CASE
                WHEN cr.pon IS NULL THEN Upper(cra.bairro)
                ELSE Concat(cr.pop, '-', cr.olt, '-', cr.pon, '-', cr.slot)
            END AS KEY
        FROM   callcenter.acompanhamento_massiva cra
            LEFT JOIN operacoes.caminho_rede cr
                    ON cr.id_contrato = cra.contrato  
        """
     
    df = pd.read_sql_query(query, conn)
    df2 = df
    interval_int  = int(interval) 
    conn.close()
       
    thirty_minutes = timedelta(minutes=interval_int)
    df['data_cadastro'] = pd.to_datetime(df['data_cadastro'])
    df2['data_cadastro'] = pd.to_datetime(df2['data_cadastro'])
    df['hora_cadastro'] = pd.to_timedelta(df['hora_cadastro'].astype(str))
    df['hora_cadastro_2'] = df['hora_cadastro'] - thirty_minutes

    current_date = df['data_cadastro'].max()
    current_date2 = df2['data_cadastro'].max()

    max_time_today = df[df['data_cadastro'] == current_date2]['hora_cadastro'].max()
    # Filtrar o DataFrame para manter apenas as informações da data de hoje
    df2 = df2[df2['data_cadastro'].dt.date == date.today()]

    # Imprimir o DataFrame resultante

    now_time_as_timedelta = pd.to_timedelta(str(datetime.now().time()))

    df['quantidade'] = ((df['data_cadastro'] == current_date) & (max_time_today - thirty_minutes <= df['hora_cadastro']) & (df['hora_cadastro'] <= now_time_as_timedelta)).astype(int)

    df2['quantidade'] = ((df2['data_cadastro'] == current_date)).astype(int)

    df['average'] = ((df['data_cadastro'] < current_date) & (max_time_today - thirty_minutes <= df['hora_cadastro']) & (df['hora_cadastro'] <= now_time_as_timedelta)).astype(int)

    #df['pon'] = df['pon'].fillna(df['bairro'])

    
    df = df.groupby(['uf', 'cidade_registro', 'key']).agg(
        quantidade=pd.NamedAgg(column='quantidade', aggfunc='sum'),
        media=pd.NamedAgg(column='average', aggfunc='mean')
    ).reset_index()

    df_grouped = df2.groupby(['cidade_registro', 'bairro']).agg(
        quantidade=pd.NamedAgg(column='quantidade', aggfunc='count'),
        media=pd.NamedAgg(column='quantidade', aggfunc='mean')
    ).reset_index()

    
    df_top_10 = df_grouped.sort_values('quantidade', ascending=False)

    df = df[df['quantidade'] > 0]

    df['percent'] = df.apply(
        lambda row: (row['quantidade'] / row['media']) if row['media'] > 0 else 0, axis=1)
    
    df['media'] = df['media'].round().astype(int)
    df['quantidade'] = df['quantidade'].astype(int)

    ufs = ["CE", "SP", "MG", "RN", "BA", "PB"]
    uf_data = {}

    for uf in ufs:
        uf_data[uf] = [row for index, row in df.iterrows() if row['uf'] == uf]

    combined_rn_pb_data = uf_data["RN"] + uf_data["PB"]
    uf_data["RN/PB"] = combined_rn_pb_data

    del uf_data["RN"]
    del uf_data["PB"]

    ordered_ufs = ["CE", "SP", "MG", "RN/PB", "BA"]

    uf_data_ordered = {uf: uf_data[uf] for uf in ordered_ufs if uf in uf_data}
      
    return uf_data, df_top_10

@app.route('/validacaoUSO', methods = ['GET'])
def USOvalidacao():
    conn = connect_db("SADIG_DB")
    query = """
    SELECT
        (SELECT MAX(hora_cadastro)
        FROM public.callcenter_registros_atendimentos_mod0022
        WHERE data_cadastro >= CURRENT_DATE) AS max_hora_cadastro,
        
        (SELECT MAX(data_finalizacao::time)
        FROM usodigital_chat_sac_mod0051
        WHERE data_inicio >= CURRENT_DATE) AS max_data_finalizacao;
    """
    
    df = pd.read_sql_query(query, conn)
   
    conn.close()
    return df.to_json(orient='records')

@app.route('/pesquisa_demanda', methods=['GET'])
def pesquisa():

    conn = connect_db("SADIG_DB")
    cursor = conn.cursor()
    query = """
select
distinct
tipobloqueio,
data
,
sum
(quantidade)
as
quantidade
from
callcenter_negocios.qtd_bloqueios
where tipobloqueio = 'BLOQUEIO PARCIAL' group
by
tipobloqueio,
data
ORDER BY 
data DESC
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()

    banco = pd.DataFrame(rows, columns=['tipobloqueio','data','quantidade'])
    banco['data'] = pd.to_datetime(banco['data'])  # Convertendo para o tipo datetime, se necessário
    banco['data'] = banco['data'].dt.strftime('%Y-%m-%d')  # Formatando as datas para o formato 'YYYY-MM-DD'
    bd = banco.to_json(orient='columns')

    return bd

@app.route('/pesquisa_demandaFULL')
def pesquisa_demanda():
    return render_template('pesquisa_demanda.html')

@app.route('/pesquisa_demandaReport1', methods=['GET'])

def pesquisa_demanda_Report1():
    conn = connect_db("SADIG_DB")
    cursor = conn.cursor()
    query = """
    select
    upper(c1.assunto) as assunto,
    count(c1.*) as total,
    sum(case when c1.carteira != 'WEBBY' then 1 else 0 end) as total_alares,
    sum(case when c1.carteira = 'WEBBY' then 1 else 0 end) as total_webby
from
    public.callcenter_registros_atendimentos_mod0022 c1
left join
    callcenter_negocios.quadro_operadores c2
on
    c1.operador_a = c2.login_imanager
    and date_trunc('month', c1.data_fechamento)::date = c2.mes_ref::date
where
    c2.grupo_de_atendimento in ('MULTISKILL', 'HD')
    and c1.data_fechamento::date >= current_date::date
group by
    assunto
having
   upper(c1.assunto) != 'ATUALIZACAO CADASTRAL'
order by
    total desc"""
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()

    assunto_contagem = pd.DataFrame(rows, columns=['Assunto', 'Total', 'Contagem Alares', 'Contagem Webby'])
    assunto_contagem = assunto_contagem.sort_values(by='Contagem Alares', ascending=False)
    primeiros_itens = assunto_contagem[['Assunto', 'Total', 'Contagem Alares','Contagem Webby']].head(5)
    assunto_contagem = primeiros_itens.to_json(orient='columns')

    return assunto_contagem

@app.route('/')
def index():
    interval = request.args.get("interval", "120")
    current_time = datetime.now().strftime("%H:%M")
    start_time = (datetime.now() - timedelta(hours=1)).strftime("%H:%M")
    uf_data, df_grouped = get_data(interval)
    print(df_grouped.keys())
    current_date = date.today().strftime("%Y-%m-%d")
    time_interval = f"{start_time} até {current_time}"
    
    return render_template('massivas.html', uf_data=uf_data, current_date=current_date, df_grouped=df_grouped, time_interval=time_interval)

@app.route('/grafico30', methods=['GET'])

def indexx():
    interval = ("30")
    df_top_10, df_top_10 = get_data(interval)
    df_top_10 = df_top_10[['bairro','quantidade']].head(50)
    
    return json.dumps(df_top_10.to_dict())

@app.route('/grafico60', methods=['GET'])

def index60():
    conn = connect_db("SADIG_DB")
    cursor = conn.cursor()
    query = """
    SELECT bairro,COUNT(*)
    FROM public.callcenter_registros_atendimentos_mod0022
    where situacao_atendimento = 'DERIVADO' and data_cadastro = current_date
    GROUP BY bairro"""
    cursor.execute(query)
    rows1 = cursor.fetchall()
    cursor.close()

    banco1 = pd.DataFrame(rows1, columns=['cidade_ibge','count'])
    banco1 = banco1.sort_values(by='count', ascending=False)
    banco1 = banco1.to_json(orient='columns')

    return banco1


@app.route('/painelVoz')
def pagina():
    vetor_geral = []
    return render_template('index.html', vetor_geral=vetor_geral)


@app.route('/update_geral', methods=['GET'])
def fazGET_GERAL():

    start_date = datetime.now().strftime('%Y-%m-%d')
    end_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    url = f"https://grupo-conexao.evolux.io/api/v1/report/answered_abandoned_sla?token=8d4f1854-0f49-4723-96cc-a7e8fff267fb&start_date={start_date}T03%3A00%3A00.000000Z&end_date={end_date}T02%3A59%3A00.000000Z&entity=queue_groups&queue_or_group=queue_groups&queue_group_ids=65&queue_group_ids=66&queue_group_ids=67&state=&group_by=half_hour&week_day=0&start_hour=00&end_hour=00"
    url_sac = f"https://grupo-conexao.evolux.io/api/v1/report/answered_abandoned_sla?token=cb6cd843-81c7-4621-9fea-0ce7e57b3398&start_date={start_date}T03%3A00%3A00.000000Z&end_date={end_date}T02%3A59%3A00.000000Z&entity=queue_groups&queue_or_group=queue_groups&queue_group_ids=65&state=&group_by=half_hour&week_day=0&start_hour=00&end_hour=00"
    url_hd = f"https://grupo-conexao.evolux.io/api/v1/report/answered_abandoned_sla?token=55ec42aa-9c5d-4e44-8214-77e91ace494e&start_date={start_date}T03%3A00%3A00.000000Z&end_date={end_date}T02%3A59%3A00.000000Z&entity=queue_groups&queue_or_group=queue_groups&queue_group_ids=66&state=&group_by=half_hour&week_day=0&start_hour=00&end_hour=00"
    url_webby = f"https://grupo-conexao.evolux.io/api/v1/report/answered_abandoned_sla?token=91440272-3f9c-45b3-8177-b2dd49c49920&start_date={start_date}T03%3A00%3A00.000000Z&end_date={end_date}T02%3A59%3A00.000000Z&entity=queue_groups&queue_or_group=queue_groups&queue_group_ids=72&queue_group_ids=73&queue_group_ids=74&state&group_by=half_hour&week_day=0&start_hour=00&end_hour=00"


    response = requests.get(url)
    time. sleep(5)
    response_sac = requests.get(url_sac)
    time. sleep(5)
    response_hd = requests.get(url_hd)
    time. sleep(5)
    response_webby = requests.get(url_webby)
    time. sleep(5)

    data = response.json()
    dataSAC = response_sac.json()
    dataHD = response_hd.json()
    dataWEBBY = response_webby.json()


    dados = data["data"]
    dadosSAC = dataSAC["data"]
    dadosHD = dataHD["data"]
    dadosWEBBY = dataWEBBY["data"]

    vetor_geral = []
    vetor_geral_SAC = []
    vetor_geral_HD = []
    vetor_geral_WEBBY = []

    for dado in dados:
        Total = dado["calls"]
        atendidas = dado["answered"]
        Percent = int(dado["answered_percent"])
        Natendidas = dado["unanswered"]
        tma_noconverter = dado["avg_talk_time"]
        tme_noconverter = dado["asa"]

        hours = tme_noconverter // 3600
        minutes = (tme_noconverter - hours * 3600) // 60
        seconds = tme_noconverter - hours * 3600 - minutes * 60

        tme = "{:02d}:{:02d}:{:02d}".format(
            int(hours), int(minutes), int(seconds))

        hours = tma_noconverter // 3600
        minutes = (tma_noconverter - hours * 3600) // 60
        seconds = tma_noconverter - hours * 3600 - minutes * 60

        tma = "{:02d}:{:02d}:{:02d}".format(
            int(hours), int(minutes), int(seconds))

        vetor_geral.append({
            "Total": Total,
            "atendidas": atendidas,
            "Percent": round(Percent, 2),
            "Natendidas": Natendidas,
            "tme": tme,
            "tma": tma
        })

        for dadoSAC in dadosSAC:
            TotalSAC = dadoSAC["calls"]
            atendidasSAC = dadoSAC["answered"]
            PercentSAC = int(dadoSAC["answered_percent"])
            NatendidasSAC = dadoSAC["unanswered"]
            tma_noconverterSAC = dadoSAC["avg_talk_time"]
            tme_noconverterSAC = dadoSAC["asa"]

            hoursSAC = tme_noconverterSAC // 3600
            minutesSAC = (tme_noconverterSAC - hoursSAC * 3600) // 60
            secondsSAC = tme_noconverterSAC - hoursSAC * 3600 - minutesSAC * 60

            tmeSAC = "{:02d}:{:02d}:{:02d}".format(int(hoursSAC), int(minutesSAC), int(secondsSAC))
            
            hoursSAC = tma_noconverterSAC // 3600
            minutesSAC = (tma_noconverterSAC - hoursSAC * 3600) // 60
            secondsSAC = tma_noconverterSAC - hoursSAC * 3600 - minutesSAC * 60

            tmaSAC = "{:02d}:{:02d}:{:02d}".format(int(hoursSAC), int(minutesSAC), int(secondsSAC))
                    
            vetor_geral_SAC.append({
                "TotalSAC": TotalSAC,
                "atendidasSAC": atendidasSAC,
                "PercentSAC": round(PercentSAC,3),
                "NatendidasSAC": NatendidasSAC,
                "tmeSAC": tmeSAC,
                "tmaSAC": tmaSAC
            })             

        for dadoHD in dadosHD:
            TotalHD = dadoHD["calls"]
            atendidasHD = dadoHD["answered"]
            PercentHD = int(dadoHD["answered_percent"])
            NatendidasHD = dadoHD["unanswered"]
            tma_noconverterHD = dadoHD["avg_talk_time"]
            tme_noconverterHD = dadoHD["asa"]

            hoursHD = tme_noconverterHD // 3600
            minutesHD = (tme_noconverterHD - hoursHD * 3600) // 60
            secondsHD = tme_noconverterHD - hoursHD * 3600 - minutesHD * 60

            tmeHD = "{:02d}:{:02d}:{:02d}".format(int(hoursHD), int(minutesHD), int(secondsHD))
            
            hoursHD = tma_noconverterHD // 3600
            minutesHD = (tma_noconverterHD - hoursHD * 3600) // 60
            secondsHD = tma_noconverterHD - hoursHD * 3600 - minutesHD * 60

            tmaHD = "{:02d}:{:02d}:{:02d}".format(int(hoursHD), int(minutesHD), int(secondsHD))
                    
            vetor_geral_HD.append({
                "TotalHD": TotalHD,
                "atendidasHD": atendidasHD,
                "PercentHD": round(PercentHD,3),
                "NatendidasHD": NatendidasHD,
                "tmeHD": tmeHD,
                "tmaHD": tmaHD
            })

        for dadowebby in dadosWEBBY:
            Totalwebby = dadowebby["calls"]
            atendidaswebby = dadowebby["answered"]
            Percentwebby = int(dadowebby["answered_percent"])
            Natendidaswebby = dadowebby["unanswered"]
            tmawebby = dadowebby["avg_talk_time"]
            tmewebby = dadowebby["asa"]

            hourswebby = tmewebby // 3600
            minuteswebby = (tmewebby - hourswebby * 3600) // 60
            secondswebby = tmewebby - hourswebby * 3600 - minuteswebby * 60

            tmewebby = "{:02d}:{:02d}:{:02d}".format(int(hourswebby), int(minuteswebby), int(secondswebby))
            
            hourswebby = tmawebby // 3600
            minuteswebby = (tmawebby - hourswebby * 3600) // 60
            secondswebby = tmawebby - hourswebby * 3600 - minuteswebby * 60

            tmawebby = "{:02d}:{:02d}:{:02d}".format(int(hourswebby), int(minuteswebby), int(secondswebby))
                    
            vetor_geral_WEBBY.append({
                "Totalwebby": Totalwebby,
                "atendidaswebby": atendidaswebby,
                "Percentwebby": round(Percentwebby,3),
                "Natendidaswebby": Natendidaswebby,
                "tmewebby": tmewebby,
                "tmawebby": tmawebby
            })

    cards = [vetor_geral[48],vetor_geral_SAC[48],vetor_geral_HD[48],vetor_geral_WEBBY[48]]
    return cards


@app.route('/grafico_index', methods=['GET'])
def graficoINDEX():

    start_date = datetime.now().strftime('%Y-%m-%d')
    end_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    url = f"https://grupo-conexao.evolux.io/api/v1/report/answered_abandoned_sla?token=8d4f1854-0f49-4723-96cc-a7e8fff267fb&start_date={start_date}T03%3A00%3A00.000000Z&end_date={end_date}T02%3A59%3A00.000000Z&entity=queue_groups&queue_or_group=queue_groups&queue_group_ids=65&queue_group_ids=66&queue_group_ids=67&state=&group_by=half_hour&week_day=0&start_hour=00&end_hour=00"
    response = requests.get(url)
    time. sleep(5)

    data = response.json()

    dados = data["data"]

    vetor_geral = []

    for dado in dados:
        Total = dado["calls"]
        atendidas = dado["answered"]
        Percent = int(dado["answered_percent"])
        Natendidas = dado["unanswered"]
        tma_noconverter = dado["avg_talk_time"]
        tme_noconverter = dado["asa"]

        hours = tme_noconverter // 3600
        minutes = (tme_noconverter - hours * 3600) // 60
        seconds = tme_noconverter - hours * 3600 - minutes * 60

        tme = "{:02d}:{:02d}:{:02d}".format(
            int(hours), int(minutes), int(seconds))

        hours = tma_noconverter // 3600
        minutes = (tma_noconverter - hours * 3600) // 60
        seconds = tma_noconverter - hours * 3600 - minutes * 60

        tma = "{:02d}:{:02d}:{:02d}".format(
            int(hours), int(minutes), int(seconds))

        vetor_geral.append({
            "Total": Total,
            "atendidas": atendidas,
            "Percent": round(Percent, 2),
            "Natendidas": Natendidas,
            "tme": tme,
            "tma": tma
        })
    
    return vetor_geral


@app.route('/update_filas', methods=['GET'])
def filas():

    # SAC
    urlSAC = f"https://grupo-conexao.evolux.io/api/realtime/v1/queue?token=91440272-3f9c-45b3-8177-b2dd49c49920&queue_ids=&group_id=65"
    urlHD = f"https://grupo-conexao.evolux.io/api/realtime/v1/queue?token=a466d030-0dfa-496f-b9d1-cdd9edd1ef4d&queue_ids=&group_id=66"

    responseSAC = requests.get(urlSAC)
    responseHD = requests.get(urlHD)
    print(responseHD)
    print(responseSAC)
    dadosSAC = responseSAC.json()
    dadosSAC_agents = responseSAC.json()
    dadosHD = responseHD.json()
    dadosHD_agents = responseHD.json()

    dadosSAC = dadosSAC["data"]["calls"]
    dadosSAC_agents = dadosSAC_agents["data"]["agents"]
    dadosHD = dadosHD["data"]["calls"]
    dadosHD_agents = dadosHD_agents["data"]["agents"]

    vetorUID = []
    vetorUID_pausas = []
    vetorUID_HD = []
    vetorUID_pausas_HD = []

    for id in dadosSAC_agents:
        vetorUID_pausas.append(id)

    contapausa = 0

    for idHD in dadosHD_agents:
        vetorUID_pausas_HD.append(idHD)

    contapausaHD = 0

    for pausaID in vetorUID_pausas:
        pausas = dadosSAC_agents[pausaID]["pause"]
        if pausas != {}:
            contapausa += 1

    for item in dadosSAC:
        vetorUID.append(item)

    for pausaIDHD in vetorUID_pausas_HD:
        pausasHD = dadosHD_agents[pausaIDHD]["pause"]
        if pausasHD != {}:
            contapausaHD += 1

    for itemHD in dadosHD:
        vetorUID_HD.append(itemHD)

    counta_atendidas = 0
    counta_espera = 0
    counta_atendidasHD = 0
    counta_esperaHD = 0

    for item1 in vetorUID:
        talking_ringing = dadosSAC[item1]['state']
        if talking_ringing == 'talking':
            counta_atendidas += 1
        elif talking_ringing == 'ringing':
            counta_espera += 1

    for itemHD in vetorUID_HD:
        talking_ringingHD = dadosHD[itemHD]['state']
        if talking_ringingHD == 'talking':
            counta_atendidasHD += 1
        elif talking_ringingHD == 'ringing':
            counta_esperaHD += 1

    espera = counta_espera + counta_esperaHD
    atendidas = counta_atendidas + counta_atendidasHD
    pausas = contapausa + contapausaHD
    vetor = [espera, atendidas, pausas]
    return vetor


"""RELATÓRIO COMPLETO DE PRODUTIVIDADE DOS OPERADORES"""


@app.route("/operadores")
def carrega_pagina():
    return render_template('operadores.html')


@app.route('/maps', methods=['GET'])
def obter_dados():
    url = 'https://script.googleusercontent.com/macros/echo?user_content_key=vZGIExatE7hRdu_fgsfZWASzmU2mTUK2004s00CMF8GKBO72MabtUR78IDK33Q6wcDwxZ5ZJSobpIFcwI9t5LQHTI6isDslUm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnE-loEaGhcvq4uW0c_EtcBXS6B96Pjwwn3vG5Yoe9sEg0BvLU6wMXnLWh7QspS11zPquI3lPWhYG9G_OYncgp4QSyBZ9YN3Huw&lib=MwEWaN7uelV707kBdCqY0SW44Rhk0v8Km'
    
    response = requests.get(url)
    data = response.json()
    
    return jsonify(data)

@app.route('/produtividade', methods=['GET'])
def produtividade():
    banco = pd.read_excel("banco_final.xlsx")
    banco = banco.drop(['10 Minutos / NR17', 'Almoço 1 Hora',
                       'Ativo de ligação', 'Banheiro', 'Gestão Clientes'], axis=1)
    banco = banco.dropna()
    return render_template('operadores_result.html', banco=banco)


"""---------------------------------------------"""


@app.route('/operador', methods=['GET'])
def fazGET_produtividade():

    start_date = datetime.now().strftime('%Y-%m-%d')
    end_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    url = f"https://grupo-conexao.evolux.io/api/v1/report/agents_performance?token=c6f2a970-ed25-41e5-8edc-0021f68ff721&start_date={start_date}T03%3A00%3A00.000Z&end_date={end_date}T02%3A59%3A59.999Z&entity=queue_groups&queue_or_group=queue_groups&queue_group_ids=52&queue_group_ids=66&queue_group_ids=65&queue_group_ids=70&agent_ids=all"

    response = requests.get(url)

    data = response.json()
    dados = data["data"]
    dados_tabela = []

    for dado in dados:
        login = dado["logon"]
        operador = dado["name"]
        quant = dado["total_in_calls"]
        ocupado = dado["percentage_occupied"]
        tma = dado["att"]
        duracao = dado["total_in_duration"]
        dados_tabela.append({
            "login": login,
            "operador": operador,
            "quant": quant,
            "ocupado": ocupado,
            "tma": tma,
            "duracao": duracao
        })

    return dados_tabela


"""------------------ USO----------------------"""

@app.route("/clientesUSO")
def forecast():
    return render_template('clientesUSO.html')

@app.route("/encerramentoUSO")
def encerramentoUSO():
    return render_template('encerramentoUSO.html')
"""----------------------------------------"""

@app.route('/home')
def home():
    return render_template('home_novo.html')


@app.route('/cadastro', methods=['GET','POST'])

def faz_cadastro():

    vetor = [
  304, 314, 620, 866, 1461, 292, 316, 1097, 1070, 562,
  1073, 833, 724, 863, 561, 1223, 1460, 1225, 610, 893,
  1294, 1124, 1500, 1463, 575, 1498, 1125, 1476, 729, 787,
  1513, 1230, 683, 1232, 1483, 283, 488, 1441, 1459, 557,
  1235, 1499, 290, 759, 1481, 349, 1275, 672, 597, 560,
  291, 358, 1296, 852, 281, 1129, 1297, 1480, 1130, 569,
  1457, 933, 1247, 1501, 1249, 745, 828, 676, 1133, 1101,
  1426, 760, 1250, 1134, 1429, 1253, 1443, 1456, 1277, 1464,
  770, 1301, 522, 1303, 1503, 1254, 1136, 518, 678, 1504,
  1440, 263, 1455, 1462, 1451, 1431, 1437, 1255, 617, 1436,
  700, 1095, 481, 1137, 521, 565, 1259, 1259, 1506, 1304,
  559, 1138, 403, 1507, 1465, 1458, 1305, 674, 1071, 1261,
  1264, 1442, 1266, 528, 1433, 1432, 593, 517, 1139, 533,
  1312, 1509, 581, 1140, 1510, 1427, 1100, 1306, 264, 1307,
  1454, 1269, 1424, 1069, 590, 1308];
    queue_ids = [1653, 1654, 1651, 1652]

    for i in range(len(vetor)):

        url = f"https://grupo-conexao.evolux.io/api/v1/agents/{vetor[i]}"
        levels = []
        for queue_id in queue_ids:
            level = {
                "queue_id": queue_id,
                "priority": 2
            }
            levels.append(level)

        payload = json.dumps({
            "levels": levels
        })
        headers = {
            'token': '91440272-3f9c-45b3-8177-b2dd49c49920',
            'Content-Type': 'application/json',
        }
        print('Ok')
        response = requests.request("PUT", url, headers=headers, data=payload)


""" Cadastrar/Atualizar operadores """


@app.route('/cadastrarOperador', methods=['GET', 'POST'])
def cadastro_operador():
    nome_operador = request.form.get('cadastrar_nomeoperador')
    login_operador = request.form.get('cadastrar_loginoperador')

    url = "https://grupo-conexao.evolux.io/api/v1/agents"

    payload = json.dumps({
        "name": nome_operador,
        "login": login_operador,
        "password": "Alares@123",
        "queues": []
    })

    headers = {
        'token': '91440272-3f9c-45b3-8177-b2dd49c49920',
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)


    return render_template('home_novo.html')


@app.route('/atualizarOperador', methods=['GET', 'POST'])
def atualizar():

    nome_operador = request.form.get('cadastrar_nomeoperador')
    login_operador = request.form.get('cadastrar_loginoperador')
    id_agent = request.form.get('id_operador')
    senha_operador = request.form.get('passnoperador')
    fila_operador = request.form.get('fila_operador')

    url = f"https://grupo-conexao.evolux.io/api/v1/agents/{id_agent}"

    payload = json.dumps({
        "name": nome_operador,
        "login": login_operador,
        "password": senha_operador,
        "queues": fila_operador
    })

    headers = {
        'token': '91440272-3f9c-45b3-8177-b2dd49c49920',
        'Content-Type': 'application/json'
    }

    response = requests.request("PUT", url, headers=headers, data=payload)

    return render_template('home_novo.html')


@app.route('/update-agent/<int:agent_id>', methods=['PUT'])
def update_agent(agent_id):
    try:
        # Recebe os dados do corpo da requisição
        data = request.get_json()

        url = f"https://grupo-conexao.evolux.io/api/v1/agents/{agent_id}"

        print(f"ID do agente: {agent_id}")  # Debug do ID
        print(f"Tipo do ID: {type(agent_id)}")  # Debug do tipo do ID

        payload = json.dumps({
            "name": data.get('name'),
            "login": data.get('login'),
            "queues": data.get('queues')
        })

        headers = {
            'token': '91440272-3f9c-45b3-8177-b2dd49c49920',
            'Content-Type': 'application/json'
        }

        response = requests.request("PUT", url, headers=headers, data=payload)
        print(response.status_code)  # Para debug
        print(response.text)  # Para debug

        # Retorna a resposta do servidor da API
        return jsonify({
            "status": response.status_code,
            "response": response.json() if response.text else None
        }), response.status_code

    except Exception as e:
        print(f"Erro: {str(e)}")  # Para debug
        return jsonify({"error": str(e)}), 500


"""----------------------------------------"""
@app.route('/caminhos', methods=['GET'])

def caminho():
    conn = connect_db("SADIG_DB")
    cursor = conn.cursor()
    query = """SELECT cra.*,
                CASE
                    WHEN cr.pon IS NULL THEN Upper(cra.bairro)
                    ELSE Concat(cr.pop, '-', cr.olt, '-', cr.pon, '-', cr.slot)
                END AS KEY
            FROM   callcenter.acompanhamento_massiva cra
                LEFT JOIN operacoes.caminho_rede cr
                        ON cr.id_contrato = cra.contrato
            where data_cadastro = current_date"""
    cursor.execute(query)
    rows1 = cursor.fetchall()
    cursor.close()

    banco1 = pd.DataFrame(rows1, columns=['data_cadastro','hora_cadastro','assunto','contrato','bairro','cidade_registro','uf','data_processamento','key'])
    banco1 = banco1.to_json(orient='columns')
    
    return banco1


@app.route('/quadro')
def quadro():
    conn = connect_db("SADIG_DB")
    cursor = conn.cursor()

    query = """
        SELECT
    nome,
    login_evolux,
    grupo_de_atendimento,
    tipo_de_atendimento,
    REPLACE(REPLACE(id_evolux, '00.0', ''), '.0', '') as id_evolux
FROM callcenter_negocios.quadro_operadores 
WHERE 
    mes_ref::date >= DATE_TRUNC('month', current_date) AND 
    grupo_de_atendimento IN ('HD', 'SAC', 'MULTISKILL', 'RETENÇÃO')"""

    cursor.execute(query)
    rows1 = cursor.fetchall()
    cursor.close()

    banco1 = pd.DataFrame(rows1, columns=['nome', 'login', 'grupo','tipo', 'id'])
    banco1 = banco1.to_json(orient='columns')
    return banco1

@app.route('/quadroUSO', methods=['GET'])
def quardro_USO():
    URL = r'C:\Users\diego.carelli\Documents\DUDU\dash_layout\Projeto - PY\USO_DADOS.xlsx'
    quadro_uso = pd.read_excel(URL, header=0, engine='openpyxl')
    quadro_uso = quadro_uso.dropna(how='any')
    return quadro_uso.to_json(orient='columns')


@app.route('/quadro_result', methods=['GET'])
def quadro_reult():

    URL = r"C:\Users\diego.carelli\VIDEOMAR REDE NORDESTE S A\Atividades Contact Center - 01. PLAN - CONTACT CENTER\06. QUADRO NOMINAL\ESTRUTURA DE ATENDIMENTO\2024\06.JUNHO\JUNHO24 - ESTRUTURA DE ATENDIMENTO.xlsx"
    quadro = pd.read_excel(URL, sheet_name='QUADRO JUNHO2024')
    quadro = quadro.iloc[1:]

    novos_nomes_colunas = {
        'Unnamed: 0': 'teste1',
        'Unnamed: 1': 'CPF',
        'Unnamed: 2': 'Unnamed',
        'Unnamed: 3': 'C.CUSTO',
        'Unnamed: 4': 'MATRICULA',
        'Unnamed: 5': 'NOME',
        'Unnamed: 6': 'ID EVOLUX',
        'Unnamed: 7': 'LOGIN EVOLUX',
        'Unnamed: 8': 'ID I-MANAGER',
        'Unnamed: 9': 'ENTRADA',
        'Unnamed: 10': 'SUPERVISOR',
        'Unnamed: 11': 'COORDENADOR',
        'Unnamed: 12': 'OPERAÇÃO',
        'Unnamed: 13': 'TIPO DE ATENDIMENTO',
        'Unnamed: 14': 'SITE',
        'Unnamed: 15': 'CARGO',
        'Unnamed: 16': 'DATA DE ADMISSAO',
        'Unnamed: 17': 'DATA DE NASC.',
        'Unnamed: 18': 'STATUS',
        'Unnamed: 19': 'DATA DESLG',
        'Unnamed: 20': 'INICIO DE FÉRIAS',
        'Unnamed: 21': 'FIM DE FÉRIAS',
        'Unnamed: 22': 'CONFG.',
        'Unnamed: 23': 'SUPORTE CHAT',
        'Unnamed: 24': 'OBS',
        'Unnamed: 25': 'FILAS',
        'Unnamed: 26': 'teste',
        'Unnamed: 27': 'Multiskill',
        'Unnamed: 28': 'CHAT',
        'Unnamed: 29': 'RETENÇÃO',
        'Unnamed: 30': 'SAC',
        'Unnamed: 31': 'HD'
    }

    df_renomeado = quadro.rename(columns=novos_nomes_colunas)
    colunas_indesejadas = [
        'teste1',
        'CPF',
        'Unnamed',
        'C.CUSTO',
        'MATRICULA',
        'ID I-MANAGER',
        'COORDENADOR',
        'CARGO',
        'DATA DE ADMISSAO',
        'DATA DE NASC.',
        'STATUS',
        'INICIO DE FÉRIAS',
        'FIM DE FÉRIAS',
        'OBS',
        'FILAS',
        'teste',
        'Multiskill',
        'CHAT',
        'RETENÇÃO',
        'SAC',
        'HD'
    ]

    df_renomeado = df_renomeado.drop(columns=colunas_indesejadas)
    return render_template('quadro_result.html', df_renomeado=df_renomeado)


@app.route('/teste', methods=['GET'])
def chat():

    url = "https://usodigital.net/portal/pages/omni_monitor_online.php"
    headers = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Cookie": biscoito
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        result = response.text 
        return result
    else:
        return f"Error: HTTP status code {response.status_code}"
    

@app.route('/B2B', methods=['GET'])
def chatt():

    url = "https://usodigital.net/portal/pages/omni_monitor_online.php"
    headers = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Cookie": biscoito
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        result = response.text 
        return result
    else:
        return f"Error: HTTP status code {response.status_code}"


@app.route('/tempoPausa', methods=['POST'])

def tempoPausa():
    data = request.get_json()
    data_start = data.get('data_start')
    data_end = data.get('data_end')

    url = f"https://usodigital.net/portal/controller/CTRL_monitor.php?action=_dashboard_usuario&DATA_DE={data_start}&DATA_ATE={data_end}&ATENDENTE=&LOGADO=&DISPONIVEL="
    headers = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Cookie": biscoito
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        result = response.text 
        return result
    else:
        return f"Error: HTTP status code {response.status_code}"

@app.route('/alterfilaUSO', methods=['POST'])
def alterUSO():
    data = request.get_json()
    agentes = data.get('agentes', [])
    print(agentes)
    url = "https://usodigital.net/portal/controller/CTRL_usuario_1.php?action=_save_agente"
    headers = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Cookie": biscoito
    }

    resultados = []
    for agente in agentes:
        payload = {
            'id': agente['id_plataforma'],
            'txt-token_huggy': 'f366c8c19f576314f2fd03fcd665e447',
            'txt-carteira_huggy': agente['agente_id'],
            'limite_343031': '5',
            'sel-departamento_343031[]': [
                55304, 55320, 56517, 60774, 60776, 
                60777, 60862, 66635, 66636, 64675, 65214
            ]
        }
        
        response = requests.post(url, headers=headers, data=payload)
        resultados.append({
            'id': agente['id_plataforma'],
            'status': response.status_code,
            'response': response.text
        })

    return jsonify(resultados)


@app.route('/upload', methods=['GET','POST'])
def download_html():
    uploaded_file = request.files['file']
    if uploaded_file.filename != '':
        # Salvar o arquivo no disco
        uploaded_file.save(uploaded_file.filename)
        
        # Processar o arquivo CSV
        ids = []
        with open(uploaded_file.filename, 'r') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                ids.append(row[0])
    
    important_messages = []

    for id in ids:
        full_url = f"https://usodigital.net/portal/controller/CTRL_chat.php?action=_list_messages&ID_CHAT={id}&REFRESH=SIM"
        headers = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Cookie": biscoito
        }
        response = requests.get(full_url, headers=headers)
        response_text = response.text
        soup = BeautifulSoup(response_text, 'html.parser')

        classes_direct_chat_text = soup.find_all(class_="direct-chat-text")

        divs_content = []
        for div in classes_direct_chat_text:
            div_content = div.get_text().strip()
            divs_content.append(div_content)

        for index, text in enumerate(divs_content):
            if "IMPORTANTE: Para agilizarmos seu atendimento, escreva mais detalhes sobre o que você deseja. Isso irá agilizar o seu atendimento.\n\nPor favor digite, ou escreva agora o que deseja!" in text:
                if index < len(divs_content) - 1:
                    important_message = [id, divs_content[index + 1]]
                    important_messages.append(important_message)

    df = pd.DataFrame(important_messages, columns=['ID', 'CONVERSA'])
    df['CONVERSA'] = df['CONVERSA'].tolist()
    todo_texto = " ".join(s for s in df['CONVERSA'])

    stopwords = set(STOPWORDS)
    stopwords.update([
    # Saudações e cortesias
    'olá', 'oi', 'bom', 'dia', 'boa', 'tarde', 'noite', 'tudo', 'bem', 
    'obrigado', 'obrigada', 'agradeço', 'por', 'favor',
    
    # Expressões comuns de atendimento
    'gostaria', 'quero', 'preciso', 'necessito', 'desejo', 'queria',
    'pode', 'poderia', 'consegue', 'solicito', 'solicitar', 'pedir',
    'verificar', 'consultar', 'informar', 'ajudar', 'resolver',
    
    # Pronomes e artigos
    'eu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas', 'me', 'meu', 'minha',
    'seu', 'sua', 'este', 'esta', 'isso', 'aquilo', 'o', 'a', 'os', 'as',
    
    # Verbos auxiliares e comuns
    'estou', 'está', 'estão', 'foi', 'vou', 'vai', 'tem', 'tinha',
    'ser', 'estar', 'fazer', 'tendo', 'havia', 'houve', 'tive',
    
    # Preposições e conjunções
    'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
    'para', 'com', 'sem', 'em', 'entre', 'sob', 'sobre',
    'mas', 'porém', 'entretanto', 'porque', 'pois',
    
    # Expressões de tempo
    'hoje', 'agora', 'já', 'ainda', 'depois', 'antes', 'quando',
    'sempre', 'nunca', 'jamais', 'enquanto',
    
    # Termos específicos de atendimento
    'atendimento', 'protocolo', 'chamado', 'ticket', 'solicitação',
    'contato', 'retorno', 'aguardo', 'aguardando', 'resposta',
    'sistema', 'erro', 'problema', 'dúvida', 'informação',
    
    # Pontuação e símbolos
    ',', '.', '!', '?', ';', ':', '(', ')', '[', ']',
    
    # Números e medidas
    'um', 'uma', 'dois', 'três', 'primeiro', 'segundo',
    'vezes', 'vez', 'apenas', 'somente',
    
    # Expressões de urgência/prioridade
    'urgente', 'importante', 'prioridade', 'emergência', 'imediato',
    'rápido', 'logo', 'breve', 'possível',
    
    # Termos de status
    'aberto', 'fechado', 'pendente', 'resolvido', 'concluído',
    'em', 'andamento', 'análise', 'processamento',
    
    # Expressões de confirmação/negação
    'sim', 'não', 'ok', 'certo', 'correto', 'errado', 'talvez',
    'confirmar', 'confirmo', 'confirmado'
        ])
    # Obter o caminho absoluto da pasta "static" do projeto Flask
    static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

    # Navegar para a pasta "img" dentro de "static"
    os.chdir(os.path.join(static_folder, 'img'))

    def extrair_ideia_central(frase):
        nltk.download('punkt')
        nltk.download('punkt_tab')
        palavras = nltk.word_tokenize(frase.lower())

        custom_stopwords = [
            # Saudações e cortesias
    'olá', 'oi', 'bom', 'dia', 'boa', 'tarde', 'noite', 'tudo', 'bem', 
    'obrigado', 'obrigada', 'agradeço', 'por', 'favor',
    
    # Expressões comuns de atendimento
    'gostaria', 'quero', 'preciso', 'necessito', 'desejo', 'queria',
    'pode', 'poderia', 'consegue', 'solicito', 'solicitar', 'pedir',
    'verificar', 'consultar', 'informar', 'ajudar', 'resolver',
    
    # Pronomes e artigos
    'eu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas', 'me', 'meu', 'minha',
    'seu', 'sua', 'este', 'esta', 'isso', 'aquilo', 'o', 'a', 'os', 'as',
    
    # Verbos auxiliares e comuns
    'estou', 'está', 'estão', 'foi', 'vou', 'vai', 'tem', 'tinha',
    'ser', 'estar', 'fazer', 'tendo', 'havia', 'houve', 'tive',
    
    # Preposições e conjunções
    'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
    'para', 'com', 'sem', 'em', 'entre', 'sob', 'sobre',
    'mas', 'porém', 'entretanto', 'porque', 'pois',
    
    # Expressões de tempo
    'hoje', 'agora', 'já', 'ainda', 'depois', 'antes', 'quando',
    'sempre', 'nunca', 'jamais', 'enquanto',
    
    # Termos específicos de atendimento
    'atendimento', 'protocolo', 'chamado', 'ticket', 'solicitação',
    'contato', 'retorno', 'aguardo', 'aguardando', 'resposta',
    'sistema', 'erro', 'problema', 'dúvida', 'informação',
    
    # Pontuação e símbolos
    ',', '.', '!', '?', ';', ':', '(', ')', '[', ']',
    
    # Números e medidas
    'um', 'uma', 'dois', 'três', 'primeiro', 'segundo',
    'vezes', 'vez', 'apenas', 'somente',
    
    # Expressões de urgência/prioridade
    'urgente', 'importante', 'prioridade', 'emergência', 'imediato',
    'rápido', 'logo', 'breve', 'possível',
    
    # Termos de status
    'aberto', 'fechado', 'pendente', 'resolvido', 'concluído',
    'em', 'andamento', 'análise', 'processamento',
    
    # Expressões de confirmação/negação
    'sim', 'não', 'ok', 'certo', 'correto', 'errado', 'talvez',
    'confirmar', 'confirmo', 'confirmado'
        ]

        # Remoção de stopwords (palavras comuns que não contribuem para a ideia central)
        palavras_sem_stopwords = [palavra for palavra in palavras if palavra not in set(custom_stopwords)]

        # Obter as 2 palavras mais relevantes
        palavras_centrais = palavras_sem_stopwords[1:3]

        return ' '.join(palavras_centrais)

    df['Ideia Central'] = df['CONVERSA'].apply(extrair_ideia_central)
    
    # Gerando a WordCloud
    wordcloud = WordCloud(stopwords=stopwords,
                          background_color="black",
                          width=800, height=600).generate(todo_texto)
                          
    wordcloud.to_file('wordcloud_output.png')

    df_records = df.to_dict(orient='records')
    return render_template('clientesUSORESULT_novo.html', df_records=df_records)

@app.route('/encerramento', methods=['GET','POST'])
def encerramento():
    
    uploaded_file = request.files['file']
    if uploaded_file.filename != '':
        # Salvar o arquivo no disco
        uploaded_file.save(uploaded_file.filename)
        
        # Processar o arquivo CSV
        ids = []
        with open(uploaded_file.filename, 'r') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                ids.append(row[0])
    
    for id in ids:
        urls = f"https://usodigital.net/portal/controller/CTRL_chat.php?action=_new_msg&mensagem=Identificamos uma anormalidade na rede recentemente, que pode causar lentidão ou oscilação na sua conexão. Nosso time de redes já está trabalhando para resolver essa questão o mais rápido possível. Pedimos, por favor, que aguarde a estabilização. Não é necessário realizar nenhuma alteração no seu equipamento, pois a normalização será feita automaticamente, por isso este atendimento será encerrado. Agradecemos a sua compreensão.&ID_CHAT={id}"
        headers = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Cookie": biscoito
            }
        time.sleep(2)
        response = requests.post(urls, headers=headers)
        print("OK - MENSAGEM")

    for id in ids:
        urls2 = f"https://usodigital.net/portal/controller/CTRL_chat.php?action=_finalizar&ID_CHAT={id}&ID_TAB=50264&TXT_TAB=&TXT_OBS=&TXT_CPF="
        headers2 = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Cookie": biscoito
            }
        time.sleep(2)
        response = requests.post(urls2, headers=headers2)
        print("OK - ENCERRAMENTO")
    return render_template('encerramentoUSO_RESULT.html')


@app.route('/mapa')
def index600():

    return render_template('mapa.html')  

@app.route('/mapaUSO')
def index6000():

    return render_template('mapaUSO.html')  

@app.route('/logados')

def logados_escalados():

    #logados e escalados
    conn = connect_db("SADIG_DB")
    cursor = conn.cursor()
    query = """    SELECT
    e.setor,
    COUNT(e.evolux) AS escalados,
    COUNT(l.agent_login) AS logados,
    e.data_processamento
FROM
    callcenter_negocios.escala_callcenter e
    LEFT JOIN (
        SELECT DISTINCT agent_login
        FROM callcenter_logon_mod0005
        WHERE time_login::DATE = CURRENT_DATE
    ) l
    ON replace(e.evolux, ' ', '') = l.agent_login
WHERE
    CASE
        WHEN e.hora_2 IN ('ANJO', 'BH', 'CF', 'FÉRIAS', 'INSS', 'LM', 'TRANSF.', 'ANAL. VT', 'DESL', 'DSR', 'PROMOVIDO', 'A.VT', 'CHAT', 'VOZ', 'FERIAS','RETENÇÃO', 'ANAL .VT')
        THEN NULL
        ELSE e.hora_2::TIME
    END <= CURRENT_TIME
    AND e.data::DATE = CURRENT_DATE
GROUP BY
    e.setor, e.data_processamento"""
    cursor.execute(query)
    rows1 = cursor.fetchall()
    cursor.close()

    escalados_logados = pd.DataFrame(rows1, columns=['Setor', 'Escalados', 'Logados', 'data_processamento'])
    escalados_logados['abs'] = round((((escalados_logados['Logados'] / escalados_logados['Escalados']))-1)*100,2)
    escalados_logados['hora'] = escalados_logados['data_processamento'].dt.strftime('%H:%M:%S')
    escalados_logados = escalados_logados.drop('data_processamento', axis=1)
    escalados_logados = escalados_logados.dropna()
    escalados_logados = escalados_logados.to_json(orient='columns')
    return escalados_logados


@app.route('/analiseTickets')
def USOanalise():
    return render_template('contratos_upload.html')


@app.route('/uploadCONTRATOS', methods=['GET','POST'])
def download_html_contrato():

    if request.method == 'POST':
        uploaded_file = request.files['file']
        if uploaded_file.filename != '':
            # Salvar o arquivo no disco
            uploaded_file.save(uploaded_file.filename)
            
            # Processar o arquivo CSV
            ids = []
            all_messages = []  # Mover a inicialização para fora do loop

            with open(uploaded_file.filename, 'r') as csvfile:
                reader = csv.reader(csvfile)
                for row in reader:
                    ids.append(row[0])
        
            total_chats = len(ids)

            for index, chat_id in enumerate(ids):
                try:
                    url = 'https://usodigital.app/api/huggy/index.php/evento/messages'
                    headers = {'Content-Type': 'application/json'}
                    time.sleep(2)
                    data = {"chatId": chat_id}
                    print(f"Processando chat_id {chat_id} ({index + 1} de {total_chats})")
                    response = requests.post(url, headers=headers, json=data)

                    if response.status_code == 200:
                        result = response.json().get('variables', {})
                        contrato, cpf = None, None

                        for key, mensagem in result.items():
                            if isinstance(mensagem, str):
                                match = re.search(r'CONTRATO:\s*(\S+).*?CPF:\s*(\S+)', mensagem, re.DOTALL)
                                if match:
                                    contrato = match.group(1)
                                    cpf = match.group(2)

                        if contrato and cpf:
                            print(f"Chat ID: {chat_id} | CONTRATO: {contrato} | CPF: {cpf}")
                            all_messages.append({"chat_id": chat_id, "contrato": contrato, "cpf": cpf})
                        else:
                            print(f"Chat ID: {chat_id} | Dados não encontrados.")

                except Exception as e:
                    print(f"Erro ao processar chat_id {chat_id}: {str(e)}")  # Adicionando tratamento de erro

            conn = connect_db("SADIG_DB")
            cursor = conn.cursor()
            
            # Converte a lista de contratos em string para a query
            contratos_str = ','.join([msg['contrato'] for msg in all_messages if 'contrato' in msg])  # Corrigido para extrair apenas contratos
            
            if contratos_str:  # Verifica se há contratos para evitar erro de SQL
                query = f"""SELECT cid_rede, pop, status_contrato, bairroconexao, id_contrato
                    FROM operacoes.caminho_rede  
                    WHERE id_contrato IN ({contratos_str})""";
                
                cursor.execute(query)
                rows = cursor.fetchall()
                cursor.close()
                conn.close()

                banco = pd.DataFrame(rows, columns=['cid_rede', 'pop', 'status_contrato', 'bairroconexao', 'id_contrato'])       
                print(banco)
                bd = banco.to_json(orient='records')                    
                return bd
            else:
                return jsonify({"error": "Nenhum contrato encontrado."}), 400  # Retorna erro se não houver contratos
                
    return jsonify({"error": "Método não permitido."}), 405  # Retorna erro se não for POST