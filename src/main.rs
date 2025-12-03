use reqwest::Client;
use serde::Deserialize;
use std::fmt::{Debug, Display, Formatter};

#[derive(Deserialize, Debug)]
struct SearchResponse {
    total_cards: u32,
    has_more: bool,
    data: Vec<Card>,
    next_page: Option<String>,
}

impl Display for SearchResponse {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        self.data.iter().for_each(|card| {
            writeln!(f, "{}", card.name).unwrap();
        });
        Ok(())
    }
}

#[derive(Deserialize, Debug)]
struct Card {
    name: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();

    let api_path = String::from("https://api.scryfall.com/cards/search");
    let query_string = String::from("t:ally");
    let url = String::from(api_path + "?q=" + &query_string);

    let mut response = serde_json::from_str::<SearchResponse>(&query(&client, url).await).unwrap();

    if response.has_more {
        // todo implement 50/100 ms between each call
        let url = response.next_page.clone().unwrap();
        let mut next_page_result =
            serde_json::from_str::<SearchResponse>(&query(&client, url).await).unwrap();
        response.data.append(&mut next_page_result.data)
    }

    if response.total_cards != response.data.len() as u32 {
        println!("error");
    }

    println!("{}", response);
    Ok(())
}

async fn query(client: &Client, url: String) -> String {
    client
        .get(url)
        .header("Accept", "*/*")
        .header("User-Agent", "Scryporter/0.1.0")
        .send()
        .await
        .unwrap()
        .text()
        .await
        .unwrap()
}
