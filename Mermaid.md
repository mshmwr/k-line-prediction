graph TD
    %% 定義風格
    classDef input fill:#e1f5fe,stroke:#01579b,color:#000
    classDef logic fill:#fff9c4,stroke:#fbc02d,color:#000
    classDef result fill:#263238,stroke:#ffffff,color:#fff
    classDef action fill:#f44336,stroke:#b71c1c,color:#fff,font-weight:bold
    classDef disabled fill:#eeeeee,stroke:#9e9e9e,color:#9e9e9e

    Start([開始]) --> DefineN[用戶設定 N 根 K 棒]
    DefineN --> InputData{資料輸入}

    subgraph Editor["數據準備區 (Data Prep)"]
        InputData -->|上傳| AI_Parse[Vision AI / CSV 解析]
        InputData -->|手動| Manual[用戶手動輸入]
        AI_Parse --> ValidateN{所有 N 行皆有數值?}
        Manual --> ValidateN
    end

    ValidateN -->|否| BtnDisabled[預測按鈕: Disabled]
    ValidateN -->|是| BtnEnabled[預測按鈕: Enabled]

    BtnEnabled -->|點擊開始預測| Calc[後端運算 Pearson 比對]
    
    subgraph Result["結果與調整區 (Scenario D)"]
        Calc --> ShowResult[顯示圖表與 Match List]
        ShowResult --> UserToggle[用戶勾選/取消案例]
        UserToggle --> UpdateTemp[更新 tempSelection 狀態<br/>右側數據不更新]
        UpdateTemp --> CheckEmpty{選中數量 > 0?}
        CheckEmpty -->|否| BtnDisabled
        CheckEmpty -->|是| BtnEnabled
    end

    BtnEnabled -.->|再次點擊| Sync[同步 tempSelection 到 appliedData<br/>更新圖表與統計結果]
    Sync --> ShowResult

    %% 樣式應用
    class AI_Parse,Manual,UserToggle input
    class ValidateN,Calc,CheckEmpty logic
    class ShowResult,Sync result
    class BtnEnabled action
    class BtnDisabled disabled