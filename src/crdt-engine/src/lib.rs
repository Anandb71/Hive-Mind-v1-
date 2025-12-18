//! HiveMind CRDT Engine
//! Conflict-free Replicated Data Types for real-time collaboration
//!
//! This module provides CRDT-based text editing operations that can be
//! compiled to WebAssembly for use in the browser.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Operation types for text editing
#[derive(Clone, Debug, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum OpType {
    Insert,
    Delete,
    Retain,
}

/// A single text operation
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Operation {
    pub op_type: String,
    pub pos: usize,
    pub content: Option<String>,
    pub length: Option<usize>,
    pub clock: u64,
    pub user_id: String,
}

/// Cursor position for a user
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Cursor {
    pub user_id: String,
    pub position: usize,
    pub selection_start: Option<usize>,
    pub selection_end: Option<usize>,
}

/// Document state with version vector
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub content: String,
    pub version: u64,
    pub operations: Vec<Operation>,
    pub version_vector: HashMap<String, u64>,
}

impl Document {
    pub fn new(id: String, initial_content: String) -> Self {
        Document {
            id,
            content: initial_content,
            version: 0,
            operations: Vec::new(),
            version_vector: HashMap::new(),
        }
    }

    pub fn apply_operation(&mut self, op: Operation) {
        match op.op_type.as_str() {
            "insert" => {
                if let Some(ref content) = op.content {
                    let pos = op.pos.min(self.content.len());
                    self.content.insert_str(pos, content);
                }
            }
            "delete" => {
                if let Some(length) = op.length {
                    let pos = op.pos.min(self.content.len());
                    let end = (pos + length).min(self.content.len());
                    self.content.replace_range(pos..end, "");
                }
            }
            _ => {}
        }

        self.version += 1;
        self.version_vector
            .entry(op.user_id.clone())
            .and_modify(|v| *v = (*v).max(op.clock))
            .or_insert(op.clock);
        self.operations.push(op);
    }

    pub fn get_operations_since(&self, version: u64) -> Vec<&Operation> {
        self.operations
            .iter()
            .skip(version as usize)
            .collect()
    }
}

/// CRDT Engine exposed to JavaScript
#[wasm_bindgen]
pub struct CrdtEngine {
    documents: HashMap<String, Document>,
    user_id: String,
    clock: u64,
    cursors: HashMap<String, Cursor>,
}

#[wasm_bindgen]
impl CrdtEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(user_id: String) -> CrdtEngine {
        CrdtEngine {
            documents: HashMap::new(),
            user_id,
            clock: 0,
            cursors: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn create_document(&mut self, id: String, initial_content: String) -> String {
        let doc = Document::new(id.clone(), initial_content);
        self.documents.insert(id.clone(), doc);
        id
    }

    #[wasm_bindgen]
    pub fn get_content(&self, doc_id: &str) -> Option<String> {
        self.documents.get(doc_id).map(|d| d.content.clone())
    }

    #[wasm_bindgen]
    pub fn insert(&mut self, doc_id: &str, pos: usize, content: String) -> String {
        self.clock += 1;
        let op = Operation {
            op_type: "insert".to_string(),
            pos,
            content: Some(content),
            length: None,
            clock: self.clock,
            user_id: self.user_id.clone(),
        };

        if let Some(doc) = self.documents.get_mut(doc_id) {
            doc.apply_operation(op.clone());
        }

        serde_json::to_string(&op).unwrap_or_default()
    }

    #[wasm_bindgen]
    pub fn delete(&mut self, doc_id: &str, pos: usize, length: usize) -> String {
        self.clock += 1;
        let op = Operation {
            op_type: "delete".to_string(),
            pos,
            content: None,
            length: Some(length),
            clock: self.clock,
            user_id: self.user_id.clone(),
        };

        if let Some(doc) = self.documents.get_mut(doc_id) {
            doc.apply_operation(op.clone());
        }

        serde_json::to_string(&op).unwrap_or_default()
    }

    #[wasm_bindgen]
    pub fn apply_remote_operation(&mut self, doc_id: &str, op_json: &str) {
        if let Ok(op) = serde_json::from_str::<Operation>(op_json) {
            if let Some(doc) = self.documents.get_mut(doc_id) {
                doc.apply_operation(op);
            }
        }
    }

    #[wasm_bindgen]
    pub fn update_cursor(&mut self, user_id: String, position: usize) {
        self.cursors.insert(
            user_id.clone(),
            Cursor {
                user_id,
                position,
                selection_start: None,
                selection_end: None,
            },
        );
    }

    #[wasm_bindgen]
    pub fn get_cursors(&self) -> String {
        let cursors: Vec<&Cursor> = self.cursors.values().collect();
        serde_json::to_string(&cursors).unwrap_or_default()
    }

    #[wasm_bindgen]
    pub fn get_version(&self, doc_id: &str) -> u64 {
        self.documents
            .get(doc_id)
            .map(|d| d.version)
            .unwrap_or(0)
    }

    #[wasm_bindgen]
    pub fn get_operations_since(&self, doc_id: &str, version: u64) -> String {
        if let Some(doc) = self.documents.get(doc_id) {
            let ops = doc.get_operations_since(version);
            serde_json::to_string(&ops).unwrap_or_default()
        } else {
            "[]".to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert() {
        let mut engine = CrdtEngine::new("user1".to_string());
        engine.create_document("doc1".to_string(), "Hello".to_string());
        engine.insert("doc1", 5, " World".to_string());
        assert_eq!(engine.get_content("doc1"), Some("Hello World".to_string()));
    }

    #[test]
    fn test_delete() {
        let mut engine = CrdtEngine::new("user1".to_string());
        engine.create_document("doc1".to_string(), "Hello World".to_string());
        engine.delete("doc1", 5, 6);
        assert_eq!(engine.get_content("doc1"), Some("Hello".to_string()));
    }
}
