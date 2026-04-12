# Classificador de Lixo

**Autor:** Vinicius Augusto Passarella de Melo  
**Disciplina:** Serviços de Software — 2026/1

---

## Descrição

Aplicação web para classificação de imagens de lixo em 6 categorias: **papelão, vidro, metal, papel, plástico e lixo comum**. O sistema indica se o material é reciclável e em qual lixeira deve ser descartado. Todas as análises são salvas em um histórico persistente.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Python, FastAPI |
| Modelo de IA | HOG (scikit-image) + SVM (scikit-learn) |
| Banco de Dados | PostgreSQL |
| Infraestrutura | Docker, Docker Compose |

---

## Modelo de IA

O modelo utiliza duas técnicas clássicas de visão computacional:

- **HOG (Histogram of Oriented Gradients):** extrai as bordas e formas da imagem como um vetor numérico.
- **SVM (Support Vector Machine):** classifica o vetor HOG em uma das 6 classes de lixo.

O modelo foi treinado com o dataset [Garbage Classification](https://www.kaggle.com/datasets/asdasdasasdas/garbage-classification) (~2.500 imagens) disponível no Kaggle.

---

## Arquitetura

```
Frontend (React) → Backend (FastAPI + Modelo) → PostgreSQL
    :3000               :8000                      :5432
```

---

## Como executar

**Pré-requisito:** Docker Desktop instalado e em execução.

```bash
git clone <url-do-repositorio>
cd classificador-lixo
docker compose up --build
```

Acesse em: [http://localhost:3000](http://localhost:3000)

---

## Páginas

- **Classificador:** envie uma foto e receba a classificação com nível de confiança.
- **Histórico:** visualize todas as análises anteriores salvas no banco de dados.
